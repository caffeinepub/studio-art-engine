import { Plus } from "lucide-react";

interface NewProjectTileProps {
  onClick: () => void;
}

export default function NewProjectTile({ onClick }: NewProjectTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative bg-card border-2 border-dashed border-border rounded-3xl p-6 cursor-pointer trait-card-lift transition-colors duration-component ease-apple hover:border-primary/40 hover:bg-card/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] flex flex-col items-center justify-center min-h-[280px] w-full"
      style={{
        transition:
          "transform var(--motion-press) var(--ease-spring-snap), border-color var(--motion-component) var(--ease-apple), background-color var(--motion-component) var(--ease-apple), box-shadow var(--motion-hover) var(--ease-apple)",
      }}
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
