import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Equal, Lock, Shuffle, Unlock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Project, Trait } from "../App";

interface RarityWorkshopProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

export default function RarityWorkshop({
  project,
  onUpdateProject,
}: RarityWorkshopProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    project.layers.length > 0 ? project.layers[0].id : null,
  );

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);

  // Auto-initialize weights when layer is selected
  useEffect(() => {
    if (!selectedLayer || selectedLayer.traits.length === 0) return;

    const hasUninitializedWeights = selectedLayer.traits.some(
      (t) =>
        typeof t.weight !== "number" || Number.isNaN(t.weight) || t.weight < 0,
    );

    const totalWeight = selectedLayer.traits.reduce(
      (sum, t) => sum + (t.weight || 0),
      0,
    );
    const needsInitialization =
      hasUninitializedWeights || Math.abs(totalWeight) < 0.01;

    if (needsInitialization) {
      const equalWeight = 100 / selectedLayer.traits.length;
      onUpdateProject((p) => ({
        ...p,
        layers: p.layers.map((l) => {
          if (l.id !== selectedLayer.id) return l;
          return {
            ...l,
            traits: l.traits.map((t, i) => ({
              ...t,
              weight:
                i === 0
                  ? Number.parseFloat(
                      (100 - equalWeight * (l.traits.length - 1)).toFixed(2),
                    )
                  : Number.parseFloat(equalWeight.toFixed(2)),
              locked: false,
            })),
          };
        }),
      }));
    }
  }, [selectedLayer, onUpdateProject]);

  // Normalize weights to ensure they sum to 100.00
  const normalizeWeights = useCallback((traits: Trait[]): Trait[] => {
    if (traits.length === 0) return traits;

    // Filter out invalid weights
    const validTraits = traits.map((t) => ({
      ...t,
      weight:
        typeof t.weight === "number" && !Number.isNaN(t.weight) && t.weight >= 0
          ? t.weight
          : 0,
    }));

    const total = validTraits.reduce((sum, t) => sum + t.weight, 0);

    // If total is zero, distribute equally
    if (total === 0) {
      const equalWeight = 100 / validTraits.length;
      return validTraits.map((t, i) => ({
        ...t,
        weight:
          i === 0
            ? Number.parseFloat(
                (100 - equalWeight * (validTraits.length - 1)).toFixed(2),
              )
            : Number.parseFloat(equalWeight.toFixed(2)),
      }));
    }

    if (Math.abs(total - 100) < 0.01) return validTraits;

    const normalized = validTraits.map((t) => ({
      ...t,
      weight: Number.parseFloat(((t.weight / total) * 100).toFixed(2)),
    }));

    // Adjust rounding errors
    const newTotal = normalized.reduce((sum, t) => sum + t.weight, 0);
    if (Math.abs(newTotal - 100) > 0.01) {
      const diff = Number.parseFloat((100 - newTotal).toFixed(2));
      normalized[0] = {
        ...normalized[0],
        weight: Number.parseFloat((normalized[0].weight + diff).toFixed(2)),
      };
    }

    return normalized;
  }, []);

  // Update trait weight with proportional adjustment
  const updateTraitWeight = useCallback(
    (layerId: string, traitId: string, newWeight: number) => {
      // Validate input
      if (typeof newWeight !== "number" || Number.isNaN(newWeight)) {
        toast.error("INVALID WEIGHT VALUE");
        return;
      }

      const clampedWeight = Math.max(0, Math.min(100, newWeight));

      onUpdateProject((p) => ({
        ...p,
        layers: p.layers.map((l) => {
          if (l.id !== layerId) return l;

          const traits = [...l.traits];
          const targetIndex = traits.findIndex((t) => t.id === traitId);
          if (targetIndex === -1) return l;

          const oldWeight = traits[targetIndex].weight || 0;
          const delta = clampedWeight - oldWeight;

          // If delta is negligible, skip update
          if (Math.abs(delta) < 0.01) return l;

          // Update target trait
          traits[targetIndex] = {
            ...traits[targetIndex],
            weight: Number.parseFloat(clampedWeight.toFixed(2)),
          };

          // Get unlocked traits (excluding target)
          const unlockedTraits = traits.filter(
            (t, i) => i !== targetIndex && !t.locked,
          );

          if (unlockedTraits.length === 0) {
            // If all other traits are locked, revert
            traits[targetIndex] = { ...traits[targetIndex], weight: oldWeight };
            toast.error("CANNOT ADJUST: ALL OTHER TRAITS LOCKED");
            return l;
          }

          const totalUnlockedWeight = unlockedTraits.reduce(
            (sum, t) => sum + (t.weight || 0),
            0,
          );

          if (totalUnlockedWeight <= 0.01) {
            traits[targetIndex] = { ...traits[targetIndex], weight: oldWeight };
            toast.error("CANNOT ADJUST: INSUFFICIENT UNLOCKED WEIGHT");
            return l;
          }

          // Apply proportional adjustment formula
          let remainingDelta = -delta;
          unlockedTraits.forEach((trait, i) => {
            const traitIndex = traits.findIndex((t) => t.id === trait.id);
            const proportion = (trait.weight || 0) / totalUnlockedWeight;

            let adjustment: number;
            if (i === unlockedTraits.length - 1) {
              // Last trait gets remaining delta to ensure exact 100%
              adjustment = remainingDelta;
            } else {
              adjustment = Number.parseFloat((proportion * -delta).toFixed(2));
            }

            const newTraitWeight = Math.max(
              0,
              Math.min(100, (trait.weight || 0) + adjustment),
            );
            traits[traitIndex] = {
              ...traits[traitIndex],
              weight: Number.parseFloat(newTraitWeight.toFixed(2)),
            };
            remainingDelta -= adjustment;
          });

          // Final normalization to ensure exactly 100%
          return { ...l, traits: normalizeWeights(traits) };
        }),
      }));
    },
    [onUpdateProject, normalizeWeights],
  );

  // Toggle lock state
  const toggleLock = useCallback(
    (layerId: string, traitId: string) => {
      onUpdateProject((p) => ({
        ...p,
        layers: p.layers.map((l) => {
          if (l.id !== layerId) return l;
          return {
            ...l,
            traits: l.traits.map((t) =>
              t.id === traitId ? { ...t, locked: !t.locked } : t,
            ),
          };
        }),
      }));
    },
    [onUpdateProject],
  );

  // Equalize all weights
  const equalizeWeights = useCallback(
    (layerId: string) => {
      onUpdateProject((p) => ({
        ...p,
        layers: p.layers.map((l) => {
          if (l.id !== layerId) return l;
          const equalWeight = Number.parseFloat(
            (100 / l.traits.length).toFixed(2),
          );
          const traits = l.traits.map((t, i) => ({
            ...t,
            weight:
              i === 0
                ? Number.parseFloat(
                    (100 - equalWeight * (l.traits.length - 1)).toFixed(2),
                  )
                : equalWeight,
            locked: false,
          }));
          return { ...l, traits: normalizeWeights(traits) };
        }),
      }));
      toast.success("WEIGHTS EQUALIZED");
    },
    [onUpdateProject, normalizeWeights],
  );

  // Randomize distribution
  const randomizeWeights = useCallback(
    (layerId: string) => {
      onUpdateProject((p) => ({
        ...p,
        layers: p.layers.map((l) => {
          if (l.id !== layerId) return l;

          const randomWeights = l.traits.map(() => Math.random() + 0.1); // Ensure minimum weight
          const total = randomWeights.reduce((sum, w) => sum + w, 0);

          const traits = l.traits.map((t, i) => ({
            ...t,
            weight: Number.parseFloat(
              ((randomWeights[i] / total) * 100).toFixed(2),
            ),
            locked: false,
          }));

          return { ...l, traits: normalizeWeights(traits) };
        }),
      }));
      toast.success("WEIGHTS RANDOMIZED");
    },
    [onUpdateProject, normalizeWeights],
  );

  // Calculate expected count for a trait
  const calculateExpectedCount = useCallback(
    (weight: number): number => {
      if (typeof weight !== "number" || Number.isNaN(weight)) return 0;
      return Math.round((weight / 100) * project.collectionSize);
    },
    [project.collectionSize],
  );

  // Check if trait is rare (<1%)
  const isRare = useCallback((weight: number): boolean => {
    return typeof weight === "number" && !Number.isNaN(weight) && weight < 1;
  }, []);

  const totalWeight = useMemo(() => {
    if (!selectedLayer) return 0;
    return selectedLayer.traits.reduce((sum, t) => sum + (t.weight || 0), 0);
  }, [selectedLayer]);

  if (project.layers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-4 border-2 border-border">
            <span className="text-2xl font-black">+</span>
          </div>
          <p className="text-sm font-black tracking-tight uppercase text-muted-foreground">
            NO LAYERS AVAILABLE
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-bold">
            Create layers in the Workshop first
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Left Sidebar - Layer Selection */}
      <div className="w-72 border-r-2 border-border bg-card flex flex-col flex-shrink-0">
        <div className="p-4 border-b-2 border-border flex-shrink-0">
          <h2 className="text-xs font-black text-muted-foreground mb-3 uppercase tracking-tight">
            LAYER SELECTION
          </h2>
          <div className="text-xs text-muted-foreground font-bold">
            {project.layers.length} Layer
            {project.layers.length !== 1 ? "s" : ""}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {project.layers.map((layer) => (
              <button
                type="button"
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`w-full p-3 border-2 transition-all text-left ${
                  selectedLayerId === layer.id
                    ? "bg-muted border-primary sharp-shadow"
                    : "bg-card border-border hover:border-muted-foreground"
                }`}
              >
                <div className="font-black text-xs text-foreground truncate uppercase tracking-tight">
                  {layer.name}
                </div>
                <div className="text-xs text-muted-foreground font-bold mt-1">
                  {layer.traits.length} Trait
                  {layer.traits.length !== 1 ? "s" : ""}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-background">
        {!selectedLayer ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-black tracking-tight uppercase">
                SELECT A LAYER
              </p>
            </div>
          </div>
        ) : selectedLayer.traits.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-black tracking-tight uppercase">
                NO TRAITS IN LAYER
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-bold">
                Add traits in the Workshop first
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="max-w-5xl mx-auto">
              {/* Header with Quick Actions */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                      {selectedLayer.name}
                    </h2>
                    <p className="text-sm text-muted-foreground font-bold mt-1">
                      {selectedLayer.traits.length} Traits • Total:{" "}
                      {totalWeight.toFixed(2)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => equalizeWeights(selectedLayer.id)}
                      variant="outline"
                      size="sm"
                      className="font-black uppercase tracking-tight border-2"
                    >
                      <Equal className="w-4 h-4 mr-2" />
                      EQUALIZE ALL
                    </Button>
                    <Button
                      onClick={() => randomizeWeights(selectedLayer.id)}
                      variant="outline"
                      size="sm"
                      className="font-black uppercase tracking-tight border-2"
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      RANDOMIZE
                    </Button>
                  </div>
                </div>

                {/* Total Weight Warning */}
                {Math.abs(totalWeight - 100) > 0.01 && (
                  <div className="p-3 bg-destructive/10 border-2 border-destructive text-destructive text-sm font-bold">
                    ⚠ TOTAL WEIGHT: {totalWeight.toFixed(2)}% (Should be
                    100.00%)
                  </div>
                )}
              </div>

              {/* Trait Cards */}
              <div className="space-y-3">
                {selectedLayer.traits.map((trait) => {
                  const expectedCount = calculateExpectedCount(trait.weight);
                  const rare = isRare(trait.weight);

                  return (
                    <Card
                      key={trait.id}
                      className={`bg-card border-2 transition-all ${
                        rare
                          ? "border-yellow-500 animate-pulse-subtle"
                          : "border-border"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Thumbnail */}
                          <div
                            className={`w-20 h-20 bg-muted border-2 flex-shrink-0 overflow-hidden ${
                              rare ? "border-yellow-500" : "border-border"
                            }`}
                          >
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

                          {/* Trait Info and Controls */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-black text-sm text-foreground truncate uppercase tracking-tight">
                                  {trait.name}
                                </div>
                                <div className="text-xs text-muted-foreground font-bold mt-1">
                                  Expected: {expectedCount} /{" "}
                                  {project.collectionSize} items
                                </div>
                              </div>

                              {/* Lock Toggle */}
                              <button
                                type="button"
                                onClick={() =>
                                  toggleLock(selectedLayer.id, trait.id)
                                }
                                className={`flex items-center gap-1 px-2 py-1 border-2 transition-all ${
                                  trait.locked
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                                }`}
                              >
                                {trait.locked ? (
                                  <Lock className="w-3 h-3" />
                                ) : (
                                  <Unlock className="w-3 h-3" />
                                )}
                                <span className="text-xs font-black uppercase">
                                  {trait.locked ? "LOCKED" : "LOCK"}
                                </span>
                              </button>
                            </div>

                            {/* Weight Display */}
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs text-muted-foreground font-bold uppercase tracking-tight">
                                RARITY WEIGHT
                              </Label>
                              <span
                                className={`text-sm font-black transition-all ${
                                  rare ? "text-yellow-500" : "text-foreground"
                                }`}
                              >
                                {(trait.weight || 0).toFixed(2)}%
                              </span>
                            </div>

                            {/* Gradient Slider */}
                            <div className="relative">
                              <Slider
                                value={[trait.weight || 0]}
                                onValueChange={([value]) =>
                                  updateTraitWeight(
                                    selectedLayer.id,
                                    trait.id,
                                    value,
                                  )
                                }
                                min={0}
                                max={100}
                                step={0.01}
                                disabled={trait.locked}
                                className="w-full rarity-slider"
                              />
                              <div
                                className="absolute inset-0 pointer-events-none rounded-full"
                                style={{
                                  background:
                                    "linear-gradient(to right, #7c3aed 0%, #0d9488 100%)",
                                  opacity: 0.2,
                                  height: "8px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                }}
                              />
                            </div>

                            {/* Rare Indicator */}
                            {rare && (
                              <div className="mt-2 text-xs font-bold text-yellow-500 uppercase tracking-tight">
                                ⚠ RARE TRAIT (&lt;1%)
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
