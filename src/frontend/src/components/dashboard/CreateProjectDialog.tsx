import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    name: string;
    symbol: string;
    collectionSize: number;
    pixelArtMode: boolean;
  }) => void;
}

export default function CreateProjectDialog({ open, onOpenChange, onCreate }: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [collectionSize, setCollectionSize] = useState('1000');
  const [pixelArtMode, setPixelArtMode] = useState(false);

  const handleCreate = () => {
    if (!name || !symbol || !collectionSize) return;
    
    onCreate({
      name,
      symbol,
      collectionSize: parseInt(collectionSize),
      pixelArtMode,
    });
    
    // Reset form
    setName('');
    setSymbol('');
    setCollectionSize('1000');
    setPixelArtMode(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">New project</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Configure your collection settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium text-sm">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Collection"
              className="bg-background border border-border focus:border-primary h-11 rounded-lg transition-all duration-component ease-apple"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="symbol" className="text-foreground font-medium text-sm">Symbol</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="NFT"
              className="bg-background border border-border focus:border-primary h-11 rounded-lg transition-all duration-component ease-apple"
            />
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
              className="bg-background border border-border focus:border-primary h-11 rounded-lg transition-all duration-component ease-apple"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl transition-all duration-hover ease-apple hover:bg-muted/40">
            <Label htmlFor="pixel" className="text-foreground font-medium text-sm">Pixel art mode</Label>
            <Switch
              id="pixel"
              checked={pixelArtMode}
              onCheckedChange={setPixelArtMode}
              className="transition-all duration-hover ease-apple"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleCreate}
            className="bg-primary text-primary-foreground font-semibold h-11 px-8 rounded-lg transition-all duration-hover ease-apple"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

