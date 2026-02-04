import { useState, useEffect, useCallback } from 'react';
import { Toaster } from '@/components/ui/sonner';
import Dashboard from './pages/Dashboard';
import Workshop from './pages/Workshop';
import RarityWorkshop from './pages/RarityWorkshop';
import Rules from './pages/Rules';
import Preview from './pages/Preview';
import Builder from './pages/Builder';
import Vault from './pages/Vault';
import Header from './components/Header';
import Footer from './components/Footer';
import ConfirmDestructiveDialog from './components/ConfirmDestructiveDialog';
import { toast } from 'sonner';
import { atomicSave, loadCanonical, cleanupLegacyArtifacts, isStorageNearQuota } from './utils/persistence';

export type Blockchain = 'ICP' | 'ETH' | 'SOL';

export interface Trait {
  id: string;
  name: string;
  imageData: string;
  weight: number;
  locked?: boolean;
}

export interface Layer {
  id: string;
  name: string;
  traits: Trait[];
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'overlay';
}

export interface Rule {
  id: string;
  type: 'exclude' | 'force';
  primaryTrait: { layerId: string; traitId: string };
  incompatibleTraits: { layerId: string; traitId: string }[];
}

export interface CustomToken {
  id: string;
  name: string;
  type: 'genesis' | 'direct';
  traits?: { layerId: string; traitId: string }[];
  imageData?: string;
  tokenNumber?: number;
}

export interface GeneratedNFT {
  id: number;
  dna: string;
  imageData: string;
  metadata: Record<string, unknown>;
  isForged?: boolean;
  forgedTokenId?: string;
}

export interface Project {
  id: string;
  name: string;
  symbol: string;
  blockchain: Blockchain;
  collectionSize: number;
  pixelArtMode: boolean;
  layers: Layer[];
  rules: Rule[];
  customTokens: CustomToken[];
  generatedNFTs: GeneratedNFT[];
  createdAt: number;
  lastGeneratedAt?: number;
}

type View = 'dashboard' | 'workshop' | 'rarity' | 'rules' | 'preview' | 'builder' | 'vault';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

// Validation and sanitization functions
function validateProject(project: any): project is Project {
  if (!project || typeof project !== 'object') return false;
  if (typeof project.id !== 'string' || !project.id) return false;
  if (typeof project.name !== 'string' || !project.name) return false;
  if (typeof project.symbol !== 'string') return false;
  if (!['ICP', 'ETH', 'SOL'].includes(project.blockchain)) return false;
  if (typeof project.collectionSize !== 'number' || project.collectionSize < 1) return false;
  if (typeof project.pixelArtMode !== 'boolean') return false;
  if (!Array.isArray(project.layers)) return false;
  if (!Array.isArray(project.rules)) return false;
  if (!Array.isArray(project.customTokens)) return false;
  if (!Array.isArray(project.generatedNFTs)) return false;
  if (typeof project.createdAt !== 'number') return false;
  return true;
}

function sanitizeProject(project: any): Project | null {
  try {
    // Ensure all required fields exist with defaults
    const sanitized: Project = {
      id: String(project.id || Date.now()),
      name: String(project.name || 'Untitled Project'),
      symbol: String(project.symbol || 'NFT'),
      blockchain: ['ICP', 'ETH', 'SOL'].includes(project.blockchain) ? project.blockchain : 'ICP',
      collectionSize: Math.max(1, parseInt(project.collectionSize) || 1000),
      pixelArtMode: Boolean(project.pixelArtMode),
      layers: Array.isArray(project.layers) ? project.layers.filter((l: any) => 
        l && typeof l.id === 'string' && typeof l.name === 'string' && Array.isArray(l.traits)
      ) : [],
      rules: Array.isArray(project.rules) ? project.rules.filter((r: any) => 
        r && typeof r.id === 'string' && r.primaryTrait && Array.isArray(r.incompatibleTraits)
      ) : [],
      customTokens: Array.isArray(project.customTokens) ? project.customTokens.filter((t: any) =>
        t && typeof t.id === 'string' && typeof t.name === 'string'
      ) : [],
      generatedNFTs: Array.isArray(project.generatedNFTs) ? project.generatedNFTs.filter((n: any) =>
        n && typeof n.id === 'number' && typeof n.dna === 'string' && n.metadata
      ) : [],
      createdAt: typeof project.createdAt === 'number' ? project.createdAt : Date.now(),
      lastGeneratedAt: typeof project.lastGeneratedAt === 'number' ? project.lastGeneratedAt : undefined,
    };

    // Migrate old rule format
    sanitized.rules = sanitized.rules.map((r: any) => {
      if (r.trait1 && r.trait2) {
        return {
          id: r.id,
          type: r.type,
          primaryTrait: r.trait1,
          incompatibleTraits: [r.trait2],
        };
      }
      return r;
    });

    // Ensure trait weights are initialized
    sanitized.layers = sanitized.layers.map(layer => ({
      ...layer,
      traits: layer.traits.map((trait: any) => ({
        ...trait,
        weight: typeof trait.weight === 'number' ? trait.weight : 0,
        locked: Boolean(trait.locked),
      })),
    }));

    return validateProject(sanitized) ? sanitized : null;
  } catch (error) {
    console.error('Error sanitizing project:', error);
    return null;
  }
}

// Normalize projects to keep only the latest generation
function normalizeProjects(projects: Project[]): Project[] {
  if (projects.length === 0) return projects;

  // Find the project with the most recent generation
  let latestGeneratedProject: Project | null = null;
  let latestTimestamp = 0;

  for (const project of projects) {
    if (project.generatedNFTs.length > 0 && project.lastGeneratedAt) {
      if (project.lastGeneratedAt > latestTimestamp) {
        latestTimestamp = project.lastGeneratedAt;
        latestGeneratedProject = project;
      }
    }
  }

  // If no project has lastGeneratedAt but some have generatedNFTs, keep the first one with NFTs
  if (!latestGeneratedProject) {
    for (const project of projects) {
      if (project.generatedNFTs.length > 0) {
        latestGeneratedProject = project;
        break;
      }
    }
  }

  // Clear generatedNFTs from all projects except the latest
  return projects.map(project => {
    if (latestGeneratedProject && project.id === latestGeneratedProject.id) {
      return project;
    }
    return {
      ...project,
      generatedNFTs: [],
    };
  });
}

function loadProjectsFromStorage(): Project[] {
  try {
    const parsed = loadCanonical();
    if (!parsed) return [];

    if (!Array.isArray(parsed)) {
      console.warn('Invalid projects data format, resetting');
      return [];
    }

    const sanitized = parsed
      .map(sanitizeProject)
      .filter((p): p is Project => p !== null);

    if (sanitized.length !== parsed.length) {
      console.warn(`Recovered ${sanitized.length} of ${parsed.length} projects`);
      toast.warning(`Recovered ${sanitized.length} projects`);
    }

    // Normalize to keep only the latest generation
    const normalized = normalizeProjects(sanitized);

    return normalized;
  } catch (error) {
    console.error('Error loading projects from storage:', error);
    toast.error('Storage error - data may be corrupted');
    return [];
  }
}

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Load projects on mount and cleanup legacy artifacts
  useEffect(() => {
    // One-time cleanup of legacy temp/backup keys
    const cleanup = cleanupLegacyArtifacts();
    if (cleanup.removed > 0) {
      console.log(`Cleaned up ${cleanup.removed} legacy storage artifact(s)`);
    }
    if (cleanup.errors > 0) {
      console.warn(`${cleanup.errors} error(s) during legacy cleanup (non-fatal)`);
    }

    // Load persisted projects
    const loadedProjects = loadProjectsFromStorage();
    setProjects(loadedProjects);
    setIsLoading(false);
  }, []);

  // Debounced auto-save with single-write pattern
  useEffect(() => {
    if (isLoading) return;

    // Set status to saving
    setSaveStatus('saving');

    const timeoutId = setTimeout(() => {
      // Validate before saving
      const validProjects = projects.filter(validateProject);
      
      if (validProjects.length !== projects.length) {
        console.warn(`Saving ${validProjects.length} of ${projects.length} valid projects`);
      }

      // Normalize to keep only the latest generation before saving
      const normalizedProjects = normalizeProjects(validProjects);

      // Check storage quota
      if (isStorageNearQuota(normalizedProjects)) {
        toast.warning('Storage nearly full - consider exporting projects');
      }

      // Attempt single-write save
      const result = atomicSave(normalizedProjects);
      
      if (result.success) {
        setSaveStatus('saved');
        
        // Reset to idle after brief "Saved" display
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('failed');
        
        // Log error details to console only (no user-facing notification)
        if (result.error?.includes('QuotaExceededError') || result.error?.includes('quota')) {
          console.error('❌ Auto-save failed: Storage quota exceeded');
          console.error('💡 Action required: Reduce project data or export projects to free up space');
        } else {
          console.error('❌ Auto-save failed:', result.error || 'Unknown error');
          console.error('💡 Check browser console for details. App will continue functioning.');
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [projects, isLoading]);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const saveProjects = useCallback((updatedProjects: Project[]) => {
    setProjects(updatedProjects);
  }, []);

  const updateCurrentProject = useCallback((updater: (project: Project) => Project) => {
    if (!currentProjectId) return;
    
    setProjects(prevProjects => {
      const updated = prevProjects.map((p) => {
        if (p.id !== currentProjectId) return p;
        
        try {
          const updatedProject = updater(p);
          return validateProject(updatedProject) ? updatedProject : p;
        } catch (error) {
          console.error('Error updating project:', error);
          toast.error('Update failed');
          return p;
        }
      });
      
      return updated;
    });
  }, [currentProjectId]);

  const updateProject = useCallback((projectId: string, updater: (project: Project) => Project) => {
    setProjects(prevProjects => {
      const updated = prevProjects.map((p) => {
        if (p.id !== projectId) return p;
        
        try {
          const updatedProject = updater(p);
          return validateProject(updatedProject) ? updatedProject : p;
        } catch (error) {
          console.error('Error updating project:', error);
          toast.error('Update failed');
          return p;
        }
      });
      
      return updated;
    });
  }, []);

  const createProject = useCallback((project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };

    if (!validateProject(newProject)) {
      toast.error('Invalid project data');
      return;
    }

    saveProjects([...projects, newProject]);
    setCurrentProjectId(newProject.id);
    setCurrentView('workshop');
    toast.success('Project created');
  }, [projects, saveProjects]);

  const deleteProject = useCallback((id: string) => {
    saveProjects(projects.filter((p) => p.id !== id));
    if (currentProjectId === id) {
      setCurrentProjectId(null);
      setCurrentView('dashboard');
    }
    toast.success('Project deleted');
  }, [projects, currentProjectId, saveProjects]);

  const openProject = useCallback((id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) {
      toast.error('Project not found');
      return;
    }
    
    setCurrentProjectId(id);
    setCurrentView('workshop');
  }, [projects]);

  if (isLoading) {
    return (
      <div className="h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        currentProject={currentProject}
        onBackToDashboard={() => {
          setCurrentView('dashboard');
          setCurrentProjectId(null);
        }}
        saveStatus={saveStatus}
      />
      
      <main className="flex-1 overflow-hidden">
        <div key={currentView} className="h-full page-transition">
          {currentView === 'dashboard' && (
            <Dashboard
              projects={projects}
              onCreateProject={createProject}
              onOpenProject={openProject}
              onDeleteProject={deleteProject}
              onUpdateProject={updateProject}
            />
          )}
          
          {currentView === 'workshop' && currentProject && (
            <Workshop
              project={currentProject}
              onUpdateProject={updateCurrentProject}
            />
          )}
          
          {currentView === 'rarity' && currentProject && (
            <RarityWorkshop
              project={currentProject}
              onUpdateProject={updateCurrentProject}
            />
          )}
          
          {currentView === 'rules' && currentProject && (
            <Rules
              project={currentProject}
              onUpdateProject={updateCurrentProject}
            />
          )}
          
          {currentView === 'preview' && currentProject && (
            <Preview
              project={currentProject}
              onUpdateProject={updateCurrentProject}
            />
          )}
          
          {currentView === 'builder' && currentProject && (
            <Builder
              project={currentProject}
              onUpdateProject={updateCurrentProject}
            />
          )}
          
          {currentView === 'vault' && currentProject && (
            <Vault
              project={currentProject}
              onUpdateProject={updateCurrentProject}
            />
          )}
        </div>
      </main>

      <Footer />
      <Toaster />
      <ConfirmDestructiveDialog />
    </div>
  );
}

export default App;
