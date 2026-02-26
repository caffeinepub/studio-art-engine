import { Plus } from 'lucide-react';

interface NewProjectTileProps {
  onClick: () => void;
}

export default function NewProjectTile({ onClick }: NewProjectTileProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-card border-2 border-dashed border-border rounded-3xl p-6 cursor-pointer transition-all duration-component ease-apple hover:border-primary/40 hover:bg-card/50 hover:-translate-y-1 focus-ring flex flex-col items-center justify-center min-h-[280px]"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center transition-all duration-component ease-apple group-hover:border-primary/40 group-hover:scale-110 group-active:scale-105">
          <Plus className="w-8 h-8 text-muted-foreground transition-colors duration-hover ease-apple group-hover:text-foreground" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider transition-colors duration-hover ease-apple group-hover:text-foreground">
          Start new project
        </span>
      </div>
    </button>
  );
}

