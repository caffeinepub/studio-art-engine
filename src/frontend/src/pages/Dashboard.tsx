import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDestructive } from '@/hooks/useConfirmDestructive';
import type { Project, Blockchain } from '../App';

interface DashboardProps {
  projects: Project[];
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (projectId: string, updater: (project: Project) => Project) => void;
}

export default function Dashboard({ projects, onCreateProject, onOpenProject, onDeleteProject, onUpdateProject }: DashboardProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [blockchain, setBlockchain] = useState<Blockchain>('ICP');
  const [collectionSize, setCollectionSize] = useState('1000');
  const [pixelArtMode, setPixelArtMode] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editSymbol, setEditSymbol] = useState('');
  const [editBlockchain, setEditBlockchain] = useState<Blockchain>('ICP');
  const [editPixelArtMode, setEditPixelArtMode] = useState(false);
  const [editTokenCount, setEditTokenCount] = useState('');

  const { confirm } = useConfirmDestructive();

  const handleCreate = () => {
    if (!name || !symbol || !collectionSize) return;
    
    onCreateProject({
      name,
      symbol,
      blockchain,
      collectionSize: parseInt(collectionSize),
      pixelArtMode,
      layers: [],
      rules: [],
      customTokens: [],
      generatedNFTs: [],
    });
    
    setIsCreateOpen(false);
    setName('');
    setSymbol('');
    setBlockchain('ICP');
    setCollectionSize('1000');
    setPixelArtMode(false);
  };

  const openSettings = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditSymbol(project.symbol);
    setEditBlockchain(project.blockchain);
    setEditPixelArtMode(project.pixelArtMode);
    setEditTokenCount(project.collectionSize.toString());
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    if (!editingProject || !editName || !editSymbol || !editTokenCount) return;

    const newTokenCount = parseInt(editTokenCount);
    if (isNaN(newTokenCount) || newTokenCount < 1) {
      toast.error('Invalid token count');
      return;
    }

    onUpdateProject(editingProject.id, (p) => ({
      ...p,
      name: editName,
      symbol: editSymbol,
      blockchain: editBlockchain,
      pixelArtMode: editPixelArtMode,
      collectionSize: newTokenCount,
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
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 fade-in">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">
                Projects
              </h1>
              <p className="text-sm text-muted-foreground">
                Create and manage your NFT collections
              </p>
            </div>

            <div className="flex justify-center mb-8 fade-in-scale">
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-11 text-sm rounded-lg"
                  >
                    New project
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border border-border max-w-xl rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">New project</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                      Configure your collection settings
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground font-medium text-sm">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Collection"
                        className="bg-background border border-border focus:border-primary h-10 rounded-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="symbol" className="text-foreground font-medium text-sm">Symbol</Label>
                      <Input
                        id="symbol"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        placeholder="NFT"
                        className="bg-background border border-border focus:border-primary h-10 rounded-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="blockchain" className="text-foreground font-medium text-sm">Blockchain</Label>
                      <Select value={blockchain} onValueChange={(v) => setBlockchain(v as Blockchain)}>
                        <SelectTrigger className="bg-background border border-border focus:border-primary font-medium h-10 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border rounded-lg">
                          <SelectItem value="ICP">ICP</SelectItem>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="SOL">SOL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="size" className="text-foreground font-medium text-sm">Collection size</Label>
                      <Input
                        id="size"
                        type="number"
                        value={collectionSize}
                        onChange={(e) => setCollectionSize(e.target.value)}
                        placeholder="1000"
                        min="1"
                        className="bg-background border border-border focus:border-primary h-10 rounded-lg"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
                      <Label htmlFor="pixel" className="text-foreground font-medium text-sm">Pixel art mode</Label>
                      <Switch
                        id="pixel"
                        checked={pixelArtMode}
                        onCheckedChange={setPixelArtMode}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      onClick={handleCreate}
                      className="bg-primary text-primary-foreground font-semibold h-10 px-6 rounded-lg"
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {projects.length === 0 ? (
              <Card className="bg-card border border-border fade-in rounded-xl">
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 bg-muted/30 flex items-center justify-center mx-auto mb-3 border border-border rounded-lg">
                    <span className="text-xl font-semibold text-muted-foreground">+</span>
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">No projects yet</p>
                  <p className="text-muted-foreground text-xs mt-1">Create your first project to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, index) => (
                  <Card
                    key={project.id}
                    className="bg-card border border-border cursor-pointer group hover:border-primary/50 transition-all rounded-xl stagger-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base mb-1 text-foreground font-semibold truncate">{project.name}</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground font-medium">
                            {project.symbol} • {project.blockchain}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSettings(project);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 rounded-lg"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1 text-xs text-muted-foreground mb-3 font-medium">
                        <div className="flex justify-between py-1">
                          <span>Size</span>
                          <span className="text-foreground font-semibold">{project.collectionSize}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Layers</span>
                          <span className="text-foreground font-semibold">{project.layers.length}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Generated</span>
                          <span className="text-foreground font-semibold">{project.generatedNFTs.length}</span>
                        </div>
                        {project.pixelArtMode && (
                          <div className="text-primary mt-1 font-semibold">Pixel mode</div>
                        )}
                      </div>
                      <Button
                        onClick={() => onOpenProject(project.id)}
                        className="w-full bg-primary text-primary-foreground font-semibold h-9 rounded-lg"
                        size="sm"
                      >
                        Open
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-card border border-border max-w-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">Project settings</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Update your project configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-foreground font-medium text-sm">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="My Collection"
                className="bg-background border border-border focus:border-primary h-10 rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-symbol" className="text-foreground font-medium text-sm">Symbol</Label>
              <Input
                id="edit-symbol"
                value={editSymbol}
                onChange={(e) => setEditSymbol(e.target.value)}
                placeholder="NFT"
                className="bg-background border border-border focus:border-primary h-10 rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-blockchain" className="text-foreground font-medium text-sm">Blockchain</Label>
              <Select value={editBlockchain} onValueChange={(v) => setEditBlockchain(v as Blockchain)}>
                <SelectTrigger className="bg-background border border-border focus:border-primary font-medium h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border rounded-lg">
                  <SelectItem value="ICP">ICP</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="SOL">SOL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-token-count" className="text-foreground font-medium text-sm">Collection size</Label>
              <Input
                id="edit-token-count"
                type="number"
                value={editTokenCount}
                onChange={(e) => setEditTokenCount(e.target.value)}
                placeholder="1000"
                min="1"
                className="bg-background border border-border focus:border-primary h-10 rounded-lg"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
              <Label htmlFor="edit-pixel" className="text-foreground font-medium text-sm">Pixel art mode</Label>
              <Switch
                id="edit-pixel"
                checked={editPixelArtMode}
                onCheckedChange={setEditPixelArtMode}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleSaveSettings}
              className="bg-primary text-primary-foreground font-semibold h-10 px-6 rounded-lg"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
