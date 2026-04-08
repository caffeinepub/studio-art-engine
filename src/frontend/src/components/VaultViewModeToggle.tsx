import { Button } from "@/components/ui/button";
import { Grid2x2, LayoutGrid } from "lucide-react";

interface VaultViewModeToggleProps {
  viewMode: "compact" | "grid";
  onViewModeChange: (mode: "compact" | "grid") => void;
}

export default function VaultViewModeToggle({
  viewMode,
  onViewModeChange,
}: VaultViewModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 bg-muted/30 rounded-lg border border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange("compact")}
        className={`h-8 px-3 font-semibold text-[10px] uppercase tracking-wider transition-all duration-component ease-apple ${
          viewMode === "compact"
            ? "bg-background text-foreground shadow-sm scale-100"
            : "text-muted-foreground hover:text-foreground hover:bg-transparent scale-95"
        }`}
      >
        <Grid2x2 className="w-3.5 h-3.5 mr-1.5" />
        Compact
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange("grid")}
        className={`h-8 px-3 font-semibold text-[10px] uppercase tracking-wider transition-all duration-component ease-apple ${
          viewMode === "grid"
            ? "bg-background text-foreground shadow-sm scale-100"
            : "text-muted-foreground hover:text-foreground hover:bg-transparent scale-95"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
        Grid
      </Button>
    </div>
  );
}
