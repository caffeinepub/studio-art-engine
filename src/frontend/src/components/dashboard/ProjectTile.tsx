import { Button } from '@/components/ui/button';
import { Settings, Trash2 } from 'lucide-react';
import type { Project } from '../../App';

interface ProjectTileProps {
  project: Project;
  onOpen: () => void;
  onSettings: () => void;
  onDelete: () => void;
  index: number;
}

export default function ProjectTile({ project, onOpen, onSettings, onDelete, index }: ProjectTileProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="group relative bg-card border border-border rounded-3xl p-6 cursor-pointer transition-all duration-component ease-apple hover:border-primary/40 hover:shadow-[0_0_24px_rgba(102,102,102,0.15)] stagger-item"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onOpen}
    >
      {/* Blockchain/Protocol Tag */}
      <div className="inline-flex items-center px-3 py-1 bg-muted/40 border border-border rounded-full mb-4">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
          {project.blockchain || 'SOL'}
        </span>
      </div>

      {/* Project Name */}
      <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
        {project.name}
      </h3>

      {/* Collection Size */}
      <div className="text-sm text-muted-foreground font-medium mb-4">
        <span className="uppercase tracking-wide">{project.collectionSize} units protocol</span>
      </div>

      {/* Initialized Date */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-medium mb-6">
        <span className="uppercase tracking-wider">Initialized</span>
        <span>{formatDate(project.createdAt)}</span>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-hover ease-apple">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onSettings();
          }}
          className="h-9 w-9 rounded-lg bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-9 w-9 rounded-lg bg-background/80 backdrop-blur-sm border border-border text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
