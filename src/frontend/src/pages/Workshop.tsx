import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Check, Edit2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Layer, Project, Trait } from "../App";

interface WorkshopProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

export default function Workshop({ project, onUpdateProject }: WorkshopProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isAddLayerOpen, setIsAddLayerOpen] = useState(false);
  const [newLayerName, setNewLayerName] = useState("");
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState("");
  const [editingTraitId, setEditingTraitId] = useState<string | null>(null);
  const [editingTraitName, setEditingTraitName] = useState("");

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);

  const addLayer = () => {
    if (!newLayerName.trim()) {
      toast.error("ENTER LAYER NAME");
      return;
    }

    const newLayer: Layer = {
      id: Date.now().toString(),
      name: newLayerName,
      traits: [],
      opacity: 100,
      blendMode: "normal",
    };

    onUpdateProject((p) => ({
      ...p,
      layers: [...p.layers, newLayer],
    }));

    setNewLayerName("");
    setIsAddLayerOpen(false);
    setSelectedLayerId(newLayer.id);
    toast.success("LAYER ADDED");
  };

  const deleteLayer = (layerId: string) => {
    onUpdateProject((p) => ({
      ...p,
      layers: p.layers.filter((l) => l.id !== layerId),
      // Preserve rules but clear references to deleted layer
      rules: p.rules
        .map((r) => {
          // If primary trait is from deleted layer, remove the rule
          if (r.primaryTrait.layerId === layerId) {
            return null;
          }
          // Remove incompatible traits from deleted layer
          const filteredIncompatibleTraits = r.incompatibleTraits.filter(
            (trait) => trait.layerId !== layerId,
          );
          // If no incompatible traits remain, remove the rule
          if (filteredIncompatibleTraits.length === 0) {
            return null;
          }
          return {
            ...r,
            incompatibleTraits: filteredIncompatibleTraits,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    }));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
    toast.success("LAYER DELETED");
  };

  const updateLayer = (layerId: string, updates: Partial<Layer>) => {
    onUpdateProject((p) => ({
      ...p,
      layers: p.layers.map((l) =>
        l.id === layerId ? { ...l, ...updates } : l,
      ),
    }));
  };

  const startEditingLayer = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingLayerName(layer.name);
  };

  const saveLayerName = () => {
    if (!editingLayerId || !editingLayerName.trim()) {
      toast.error("ENTER VALID NAME");
      return;
    }

    updateLayer(editingLayerId, { name: editingLayerName.trim() });
    setEditingLayerId(null);
    setEditingLayerName("");
    toast.success("LAYER RENAMED");
  };

  const cancelEditingLayer = () => {
    setEditingLayerId(null);
    setEditingLayerName("");
  };

  const startEditingTrait = (trait: Trait) => {
    setEditingTraitId(trait.id);
    setEditingTraitName(trait.name);
  };

  const saveTraitName = (layerId: string) => {
    if (!editingTraitId || !editingTraitName.trim()) {
      toast.error("ENTER VALID NAME");
      return;
    }

    onUpdateProject((p) => ({
      ...p,
      layers: p.layers.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          traits: l.traits.map((t) =>
            t.id === editingTraitId
              ? { ...t, name: editingTraitName.trim() }
              : t,
          ),
        };
      }),
    }));

    setEditingTraitId(null);
    setEditingTraitName("");
    toast.success("TRAIT RENAMED");
  };

  const cancelEditingTrait = () => {
    setEditingTraitId(null);
    setEditingTraitName("");
  };

  const handleFileUpload = useCallback(
    async (layerId: string, files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newTraits: Trait[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        if (!file.type.startsWith("image/")) {
          toast.error(`SKIPPED: ${file.name} (NOT AN IMAGE)`);
          continue;
        }

        try {
          const reader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            reader.onload = (e) => {
              const imageData = e.target?.result as string;
              const traitName = file.name.replace(/\.[^/.]+$/, "");

              newTraits.push({
                id: `${Date.now()}-${Math.random()}`,
                name: traitName,
                imageData,
                weight: 0,
              });
              resolve();
            };
            reader.onerror = () =>
              reject(new Error(`Failed to read ${file.name}`));
            reader.readAsDataURL(file);
          });
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
          toast.error(`ERROR READING: ${file.name}`);
        }
      }

      if (newTraits.length === 0) {
        toast.error("NO VALID IMAGES");
        return;
      }

      onUpdateProject((p) => ({
        ...p,
        layers: p.layers.map((l) => {
          if (l.id !== layerId) return l;
          return {
            ...l,
            traits: [...l.traits, ...newTraits],
          };
        }),
      }));

      toast.success(
        `${newTraits.length} TRAIT${newTraits.length > 1 ? "S" : ""} ADDED`,
      );
    },
    [onUpdateProject],
  );

  const deleteTrait = (layerId: string, traitId: string) => {
    onUpdateProject((p) => ({
      ...p,
      layers: p.layers.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          traits: l.traits.filter((t) => t.id !== traitId),
        };
      }),
      // Preserve rules but clear references to deleted trait
      rules: p.rules
        .map((r) => {
          // If primary trait is the deleted trait, remove the rule
          if (
            r.primaryTrait.layerId === layerId &&
            r.primaryTrait.traitId === traitId
          ) {
            return null;
          }
          // Remove the deleted trait from incompatible traits
          const filteredIncompatibleTraits = r.incompatibleTraits.filter(
            (trait) =>
              !(trait.layerId === layerId && trait.traitId === traitId),
          );
          // If no incompatible traits remain, remove the rule
          if (filteredIncompatibleTraits.length === 0) {
            return null;
          }
          return {
            ...r,
            incompatibleTraits: filteredIncompatibleTraits,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    }));
    toast.success("TRAIT DELETED");
  };

  const handleDragStart = (layerId: string) => {
    setDraggedLayerId(layerId);
  };

  const handleDragOver = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetLayerId) return;

    onUpdateProject((p) => {
      const layers = [...p.layers];
      const draggedIndex = layers.findIndex((l) => l.id === draggedLayerId);
      const targetIndex = layers.findIndex((l) => l.id === targetLayerId);

      const [removed] = layers.splice(draggedIndex, 1);
      layers.splice(targetIndex, 0, removed);

      return { ...p, layers };
    });
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
  };

  return (
    <div className="h-full flex overflow-hidden">
      <div className="w-72 border-r-2 border-border bg-card flex flex-col flex-shrink-0">
        <div className="p-4 border-b-2 border-border flex-shrink-0">
          <h2 className="text-xs font-black text-muted-foreground mb-3 uppercase tracking-tight">
            LAYERS
          </h2>
          <Button
            onClick={() => setIsAddLayerOpen(true)}
            className="w-full bg-primary text-primary-foreground font-black sharp-shadow uppercase tracking-tight"
            size="sm"
          >
            ADD LAYER
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {project.layers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-xs font-black uppercase tracking-tight">
                  NO LAYERS
                </p>
              </div>
            ) : (
              project.layers.map((layer) => (
                <div
                  key={layer.id}
                  draggable={editingLayerId !== layer.id}
                  onDragStart={() => handleDragStart(layer.id)}
                  onDragOver={(e) => handleDragOver(e, layer.id)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 border-2 transition-all group ${
                    selectedLayerId === layer.id
                      ? "bg-muted border-primary sharp-shadow"
                      : "bg-card border-border hover:border-muted-foreground"
                  } ${editingLayerId === layer.id ? "" : "cursor-move"}`}
                  onClick={() =>
                    editingLayerId !== layer.id && setSelectedLayerId(layer.id)
                  }
                  onKeyUp={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      editingLayerId !== layer.id &&
                        setSelectedLayerId(layer.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    {editingLayerId !== layer.id && (
                      <span className="text-xs font-black text-muted-foreground mt-0.5 flex-shrink-0">
                        ≡
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      {editingLayerId === layer.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingLayerName}
                            onChange={(e) =>
                              setEditingLayerName(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveLayerName();
                              if (e.key === "Escape") cancelEditingLayer();
                            }}
                            className="h-7 text-xs font-black uppercase tracking-tight bg-background border-primary"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveLayerName();
                            }}
                            className="text-accent hover:text-accent/80 flex-shrink-0"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditingLayer();
                            }}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-black text-xs text-foreground truncate uppercase tracking-tight flex-1">
                              {layer.name}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingLayer(layer);
                              }}
                              className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                              title="Rename layer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-xs text-muted-foreground font-bold">
                            {layer.traits.length} trait
                            {layer.traits.length !== 1 ? "s" : ""}
                          </div>
                        </>
                      )}
                    </div>
                    {editingLayerId !== layer.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLayer(layer.id);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 flex-shrink-0"
                      >
                        <span className="text-xs font-black">×</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        {!selectedLayer ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-4 border-2 border-border">
                <span className="text-2xl font-black">+</span>
              </div>
              <p className="text-sm font-black tracking-tight uppercase">
                SELECT LAYER
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-black mb-1 text-foreground uppercase tracking-tight">
                  {selectedLayer.name}
                </h2>
                <p className="text-xs text-muted-foreground font-bold">
                  Manage traits and layer settings. Adjust rarity weights in the
                  Rarity Workshop.
                </p>
              </div>

              <div className="space-y-4">
                <Card className="bg-card border-2 border-border sharp-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-foreground font-black uppercase tracking-tight">
                      SETTINGS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-foreground font-bold uppercase tracking-tight">
                        OPACITY {selectedLayer.opacity}%
                      </Label>
                      <Slider
                        value={[selectedLayer.opacity]}
                        onValueChange={([value]) =>
                          updateLayer(selectedLayer.id, { opacity: value })
                        }
                        min={0}
                        max={100}
                        step={1}
                        className="transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-foreground font-bold uppercase tracking-tight">
                        BLEND
                      </Label>
                      <Select
                        value={selectedLayer.blendMode}
                        onValueChange={(value: any) =>
                          updateLayer(selectedLayer.id, { blendMode: value })
                        }
                      >
                        <SelectTrigger className="bg-background border-2 border-border font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-2 border-border">
                          <SelectItem value="normal">NORMAL</SelectItem>
                          <SelectItem value="multiply">MULTIPLY</SelectItem>
                          <SelectItem value="overlay">OVERLAY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight">
                    TRAITS ({selectedLayer.traits.length})
                  </h3>
                  <Button
                    onClick={() =>
                      document
                        .getElementById(`file-${selectedLayer.id}`)
                        ?.click()
                    }
                    className="bg-primary text-primary-foreground font-black sharp-shadow uppercase tracking-tight"
                    size="sm"
                  >
                    ADD TRAITS
                  </Button>
                  <input
                    id={`file-${selectedLayer.id}`}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(selectedLayer.id, e.target.files)
                    }
                  />
                </div>

                {selectedLayer.traits.length === 0 ? (
                  <Card className="bg-card border-2 border-border sharp-shadow">
                    <CardContent className="py-12 text-center">
                      <p className="text-sm text-muted-foreground font-black uppercase tracking-tight">
                        NO TRAITS
                      </p>
                      <p className="text-xs text-muted-foreground font-bold mt-2">
                        Upload images to add traits
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedLayer.traits.map((trait) => (
                      <Card
                        key={trait.id}
                        className="bg-card border-2 border-border sharp-shadow-hover transition-all group"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-muted border-2 border-border flex-shrink-0 overflow-hidden">
                              <img
                                src={trait.imageData}
                                alt={trait.name}
                                className="w-full h-full object-contain"
                                style={{
                                  imageRendering: project.pixelArtMode
                                    ? "pixelated"
                                    : "auto",
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              {editingTraitId === trait.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={editingTraitName}
                                    onChange={(e) =>
                                      setEditingTraitName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        saveTraitName(selectedLayer.id);
                                      if (e.key === "Escape")
                                        cancelEditingTrait();
                                    }}
                                    className="h-7 text-xs font-black uppercase tracking-tight bg-background border-primary"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      saveTraitName(selectedLayer.id)
                                    }
                                    className="text-accent hover:text-accent/80 flex-shrink-0"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingTrait}
                                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="font-black text-sm text-foreground truncate uppercase tracking-tight flex-1">
                                    {trait.name}
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => startEditingTrait(trait)}
                                      className="text-muted-foreground hover:text-primary transition-colors"
                                      title="Rename trait"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        deleteTrait(selectedLayer.id, trait.id)
                                      }
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                                    >
                                      <span className="text-xs font-black">
                                        ×
                                      </span>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isAddLayerOpen} onOpenChange={setIsAddLayerOpen}>
        <DialogContent className="bg-card border-2 border-border sharp-shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground font-black uppercase tracking-tight">
              NEW LAYER
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold uppercase tracking-tight text-xs">
              CREATE LAYER
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label
              htmlFor="layerName"
              className="text-foreground font-bold uppercase tracking-tight text-xs"
            >
              NAME
            </Label>
            <Input
              id="layerName"
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              placeholder="LAYER NAME"
              className="bg-background border-2 border-border mt-2 font-bold"
              onKeyDown={(e) => e.key === "Enter" && addLayer()}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={addLayer}
              className="bg-primary text-primary-foreground font-black sharp-shadow uppercase tracking-tight"
            >
              ADD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
