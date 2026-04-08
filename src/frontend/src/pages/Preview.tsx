import { Switch } from "@/components/ui/switch";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Project } from "../App";

interface PreviewProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

export default function Preview({ project, onUpdateProject }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string>>(
    {},
  );
  const [isShuffling, setIsShuffling] = useState(false);
  const [pixelMode, setPixelMode] = useState(project.pixelArtMode || false);

  const validLayers = useMemo(
    () => project.layers.filter((l) => l.traits.length > 0),
    [project.layers],
  );

  const isValidCombination = useCallback(
    (traits: Record<string, string>): boolean => {
      for (const rule of project.rules) {
        const hasPrimary =
          traits[rule.primaryTrait.layerId] === rule.primaryTrait.traitId;

        if (!hasPrimary) continue;

        for (const incompatibleTrait of rule.incompatibleTraits) {
          const hasIncompatible =
            traits[incompatibleTrait.layerId] === incompatibleTrait.traitId;

          if (rule.type === "exclude" && hasIncompatible) {
            return false;
          }
          if (rule.type === "force" && !hasIncompatible) {
            return false;
          }
        }
      }
      return true;
    },
    [project.rules],
  );

  const selectRandomTraits = useCallback((): Record<string, string> => {
    const newSelection: Record<string, string> = {};
    for (const layer of validLayers) {
      const random = Math.random() * 100;
      let cumulative = 0;
      for (const trait of layer.traits) {
        cumulative += trait.weight;
        if (random <= cumulative) {
          newSelection[layer.id] = trait.id;
          break;
        }
      }
    }
    return newSelection;
  }, [validLayers]);

  const shuffleTraits = useCallback(() => {
    setIsShuffling(true);
    let attempts = 0;
    const maxAttempts = 100;
    let validCombination: Record<string, string> | null = null;

    while (attempts < maxAttempts) {
      const candidate = selectRandomTraits();
      if (isValidCombination(candidate)) {
        validCombination = candidate;
        break;
      }
      attempts++;
    }

    if (validCombination) {
      setSelectedTraits(validCombination);
      toast.success("VALID COMBINATION");
    } else {
      const fallback = selectRandomTraits();
      setSelectedTraits(fallback);
      toast.warning("NO VALID COMBINATION AFTER 100 ATTEMPTS");
    }
    setIsShuffling(false);
  }, [selectRandomTraits, isValidCombination]);

  const mergeLayers = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = project.settings.outputSize;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pixelMode) {
      ctx.imageSmoothingEnabled = false;
    }

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      const imagePromises = validLayers.map(async (layer) => {
        const traitId = selectedTraits[layer.id];
        if (!traitId) return null;

        const trait = layer.traits.find((t) => t.id === traitId);
        if (!trait) return null;

        const img = await loadImage(trait.imageData);
        return { img, layer };
      });

      const loadedImages = await Promise.all(imagePromises);

      // Draw layers in reverse order: lower layers first, higher layers last (on top)
      for (let i = loadedImages.length - 1; i >= 0; i--) {
        const item = loadedImages[i];
        if (!item) continue;
        const { img, layer } = item;

        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation =
          layer.blendMode as GlobalCompositeOperation;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    } catch (error) {
      console.error("Error rendering layers:", error);
      toast.error("RENDER ERROR");
    }
  }, [selectedTraits, validLayers, pixelMode, project.settings.outputSize]);

  const handlePixelModeToggle = useCallback(
    (checked: boolean) => {
      setPixelMode(checked);
      onUpdateProject((prev) => ({
        ...prev,
        pixelArtMode: checked,
      }));
    },
    [onUpdateProject],
  );

  useEffect(() => {
    if (validLayers.length > 0 && Object.keys(selectedTraits).length === 0) {
      shuffleTraits();
    }
  }, [validLayers, selectedTraits, shuffleTraits]);

  useEffect(() => {
    if (Object.keys(selectedTraits).length > 0) {
      mergeLayers();
    }
  }, [selectedTraits, mergeLayers]);

  return (
    <div className="h-full flex items-center justify-center bg-background overflow-hidden">
      <div className="w-full max-w-xl px-6 py-12">
        {validLayers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground font-black uppercase tracking-tight">
              ADD LAYERS TO START
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 fade-in">
            {/* Preview Frame */}
            <div className="relative w-full aspect-square max-w-md">
              <div
                className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl shadow-2xl"
                style={{
                  boxShadow:
                    "0 20px 60px rgba(0, 0, 0, 0.8), inset 0 0 0 6px rgba(0, 0, 0, 0.6)",
                }}
              >
                <div className="absolute inset-3 bg-[#0a0a0a] rounded-xl overflow-hidden flex items-center justify-center p-6">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain rounded-lg"
                    style={{
                      imageRendering: pixelMode ? "pixelated" : "auto",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={shuffleTraits}
              disabled={isShuffling}
              className="w-full max-w-md h-12 bg-[#666666] hover:bg-[#777777] disabled:bg-[#555555] text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all duration-200 smooth-hover disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                boxShadow: "0 6px 20px rgba(102, 102, 102, 0.4)",
              }}
            >
              {isShuffling ? "GENERATING..." : "GENERATE RANDOM MIX"}
            </button>

            {/* Toggle Switch Section */}
            <div className="w-full max-w-md bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a] smooth-transition">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <label
                    htmlFor="pixel-mode"
                    className="text-sm font-black text-white uppercase tracking-tight cursor-pointer"
                  >
                    HIGH FIDELITY PIXEL MODE
                  </label>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                    MAINTAIN SHARP EDGES
                  </span>
                </div>
                <Switch
                  id="pixel-mode"
                  checked={pixelMode}
                  onCheckedChange={handlePixelModeToggle}
                  className="data-[state=checked]:bg-[#888888] smooth-transition"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
