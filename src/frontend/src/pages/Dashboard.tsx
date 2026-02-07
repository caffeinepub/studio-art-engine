import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/icons';
import type { Project } from '../App';
import ProjectTile from '../components/dashboard/ProjectTile';
import NewProjectTile from '../components/dashboard/NewProjectTile';
import CreateProjectDialog from '../components/dashboard/CreateProjectDialog';
import ProjectSettingsDialog from '../components/dashboard/ProjectSettingsDialog';
import GlossyHeroText from '../components/dashboard/GlossyHeroText';

interface DashboardProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: (project: Project) => void;
  onUpdateProject: (projectId: string, updater: (project: Project) => Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function Dashboard({
  projects,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: DashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleCreateProject = (data: { name: string; symbol: string; collectionSize: number; pixelArtMode: boolean }) => {
    const newProject: Project = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      symbol: data.symbol,
      blockchain: 'ETH',
      collectionSize: data.collectionSize,
      pixelArtMode: data.pixelArtMode,
      layers: [],
      rules: [],
      customTokens: [],
      generatedNFTs: [],
      createdAt: Date.now(),
      collectionLocked: false,
      ipfsPublishing: { status: 'not-ready' },
      settings: {
        outputSize: 800,
        metadataFormat: 'ethereum',
        tokenNameTemplate: '{{collection}} #{{id}}',
        tokenDescription: '',
        startTokenNumberAtZero: false,
        royaltiesPercent: 5,
        pinataApiKey: '',
      },
    };
    onCreateProject(newProject);
    setIsCreateDialogOpen(false);
  };

  const handleSaveProjectSettings = (data: { name: string; symbol: string; collectionSize: number; pixelArtMode: boolean }) => {
    if (!editingProject) return;
    
    onUpdateProject(editingProject.id, (project) => ({
      ...project,
      name: data.name,
      symbol: data.symbol,
      collectionSize: data.collectionSize,
      pixelArtMode: data.pixelArtMode,
    }));
    setEditingProject(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground page-transition">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <div className="space-y-4">
          <GlossyHeroText />
          <p className="text-lg text-muted-foreground max-w-2xl">
            Create generative NFT collections with layered art, rarity controls, and blockchain-ready metadata.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Your Projects</h2>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="focus-ring">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Project Tile */}
            <NewProjectTile onClick={() => setIsCreateDialogOpen(true)} />

            {/* Existing Projects */}
            {projects.map((project, index) => (
              <ProjectTile
                key={project.id}
                project={project}
                onOpen={() => onSelectProject(project)}
                onSettings={() => setEditingProject(project)}
                onDelete={() => onDeleteProject(project.id)}
                index={index}
              />
            ))}
          </div>

          {projects.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No projects yet. Start by creating your first one!</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="focus-ring">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreateProject}
      />

      <ProjectSettingsDialog
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        project={editingProject}
        onSave={handleSaveProjectSettings}
      />
    </div>
  );
}
