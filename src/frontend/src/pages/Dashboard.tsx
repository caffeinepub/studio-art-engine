import { useState } from 'react';
import { useConfirmDestructive } from '@/hooks/useConfirmDestructive';
import { toast } from 'sonner';
import ProjectTile from '@/components/dashboard/ProjectTile';
import NewProjectTile from '@/components/dashboard/NewProjectTile';
import CreateProjectDialog from '@/components/dashboard/CreateProjectDialog';
import ProjectSettingsDialog from '@/components/dashboard/ProjectSettingsDialog';
import type { Project } from '../App';

interface DashboardProps {
  projects: Project[];
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'settings'> & { settings?: Partial<Project['settings']> }) => void;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (projectId: string, updater: (project: Project) => Project) => void;
}

export default function Dashboard({ projects, onCreateProject, onOpenProject, onDeleteProject, onUpdateProject }: DashboardProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { confirm } = useConfirmDestructive();

  const handleCreate = (data: { name: string; symbol: string; collectionSize: number; pixelArtMode: boolean }) => {
    onCreateProject({
      name: data.name,
      symbol: data.symbol,
      blockchain: 'SOL',
      collectionSize: data.collectionSize,
      pixelArtMode: data.pixelArtMode,
      layers: [],
      rules: [],
      customTokens: [],
      generatedNFTs: [],
    });
    
    setIsCreateOpen(false);
  };

  const openSettings = (project: Project) => {
    setEditingProject(project);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = (data: { name: string; symbol: string; collectionSize: number; pixelArtMode: boolean }) => {
    if (!editingProject) return;

    onUpdateProject(editingProject.id, (p) => ({
      ...p,
      name: data.name,
      symbol: data.symbol,
      pixelArtMode: data.pixelArtMode,
      collectionSize: data.collectionSize,
    }));

    setIsSettingsOpen(false);
    setEditingProject(null);
    toast.success('Project updated');
  };

  const handleDeleteProject = async (project: Project) => {
    const confirmed = await confirm({
      title: 'Delete project?',
      description: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
    });

    if (confirmed) {
      onDeleteProject(project.id);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="mb-16 sm:mb-20 fade-in">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-12">
                <div className="flex-1">
                  <div className="mb-3">
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/60">
                      Professional suite
                    </span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter mb-4">
                    <span className="text-foreground">GENESIS</span>
                    <span className="text-muted-foreground/40">.ENGINE</span>
                  </h1>
                </div>
                <div className="lg:text-right lg:max-w-xs">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Industrial-grade generative architecture for high-fidelity digital artifacts.
                  </p>
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* New Project Tile */}
              <NewProjectTile onClick={() => setIsCreateOpen(true)} />

              {/* Existing Projects */}
              {projects.map((project, index) => (
                <ProjectTile
                  key={project.id}
                  project={project}
                  onOpen={() => onOpenProject(project.id)}
                  onSettings={() => openSettings(project)}
                  onDelete={() => handleDeleteProject(project)}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreate}
      />

      <ProjectSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        project={editingProject}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
