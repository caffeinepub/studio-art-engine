import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Project } from "../../App";

interface ProjectSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSave: (data: {
    name: string;
    symbol: string;
    collectionSize: number;
    pixelArtMode: boolean;
  }) => void;
}

export default function ProjectSettingsDialog({
  open,
  onOpenChange,
  project,
  onSave,
}: ProjectSettingsDialogProps) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [collectionSize, setCollectionSize] = useState("");
  const [pixelArtMode, setPixelArtMode] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setSymbol(project.symbol);
      setCollectionSize(project.collectionSize.toString());
      setPixelArtMode(project.pixelArtMode);
    }
  }, [project]);

  const handleSave = () => {
    if (!name || !symbol || !collectionSize) return;

    const newTokenCount = Number.parseInt(collectionSize);
    if (Number.isNaN(newTokenCount) || newTokenCount < 1) {
      toast.error("Invalid token count");
      return;
    }

    onSave({
      name,
      symbol,
      collectionSize: newTokenCount,
      pixelArtMode,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Project settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Update your project configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label
              htmlFor="edit-name"
              className="text-foreground font-medium text-sm"
            >
              Name
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Collection"
              className="bg-background border border-border focus:border-primary h-11 rounded-lg transition-all duration-component ease-apple"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="edit-symbol"
              className="text-foreground font-medium text-sm"
            >
              Symbol
            </Label>
            <Input
              id="edit-symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="NFT"
              className="bg-background border border-border focus:border-primary h-11 rounded-lg transition-all duration-component ease-apple"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="edit-token-count"
              className="text-foreground font-medium text-sm"
            >
              Collection size
            </Label>
            <Input
              id="edit-token-count"
              type="number"
              value={collectionSize}
              onChange={(e) => setCollectionSize(e.target.value)}
              placeholder="1000"
              min="1"
              className="bg-background border border-border focus:border-primary h-11 rounded-lg transition-all duration-component ease-apple"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl transition-all duration-hover ease-apple hover:bg-muted/40">
            <Label
              htmlFor="edit-pixel"
              className="text-foreground font-medium text-sm"
            >
              Pixel art mode
            </Label>
            <Switch
              id="edit-pixel"
              checked={pixelArtMode}
              onCheckedChange={setPixelArtMode}
              className="transition-all duration-hover ease-apple"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground font-semibold h-11 px-8 rounded-lg transition-all duration-hover ease-apple"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
