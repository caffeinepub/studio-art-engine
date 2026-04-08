import { r as reactExports, u as ue, j as jsxRuntimeExports, S as Switch } from "./index-pc9VbM7E.js";
function Preview({ project, onUpdateProject }) {
  const canvasRef = reactExports.useRef(null);
  const [selectedTraits, setSelectedTraits] = reactExports.useState(
    {}
  );
  const [isShuffling, setIsShuffling] = reactExports.useState(false);
  const [pixelMode, setPixelMode] = reactExports.useState(project.pixelArtMode || false);
  const validLayers = reactExports.useMemo(
    () => project.layers.filter((l) => l.traits.length > 0),
    [project.layers]
  );
  const isValidCombination = reactExports.useCallback(
    (traits) => {
      for (const rule of project.rules) {
        const hasPrimary = traits[rule.primaryTrait.layerId] === rule.primaryTrait.traitId;
        if (!hasPrimary) continue;
        for (const incompatibleTrait of rule.incompatibleTraits) {
          const hasIncompatible = traits[incompatibleTrait.layerId] === incompatibleTrait.traitId;
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
    [project.rules]
  );
  const selectRandomTraits = reactExports.useCallback(() => {
    const newSelection = {};
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
  const shuffleTraits = reactExports.useCallback(() => {
    setIsShuffling(true);
    let attempts = 0;
    const maxAttempts = 100;
    let validCombination = null;
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
      ue.success("VALID COMBINATION");
    } else {
      const fallback = selectRandomTraits();
      setSelectedTraits(fallback);
      ue.warning("NO VALID COMBINATION AFTER 100 ATTEMPTS");
    }
    setIsShuffling(false);
  }, [selectRandomTraits, isValidCombination]);
  const mergeLayers = reactExports.useCallback(async () => {
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
    const loadImage = (src) => {
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
      for (let i = loadedImages.length - 1; i >= 0; i--) {
        const item = loadedImages[i];
        if (!item) continue;
        const { img, layer } = item;
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    } catch (error) {
      console.error("Error rendering layers:", error);
      ue.error("RENDER ERROR");
    }
  }, [selectedTraits, validLayers, pixelMode, project.settings.outputSize]);
  const handlePixelModeToggle = reactExports.useCallback(
    (checked) => {
      setPixelMode(checked);
      onUpdateProject((prev) => ({
        ...prev,
        pixelArtMode: checked
      }));
    },
    [onUpdateProject]
  );
  reactExports.useEffect(() => {
    if (validLayers.length > 0 && Object.keys(selectedTraits).length === 0) {
      shuffleTraits();
    }
  }, [validLayers, selectedTraits, shuffleTraits]);
  reactExports.useEffect(() => {
    if (Object.keys(selectedTraits).length > 0) {
      mergeLayers();
    }
  }, [selectedTraits, mergeLayers]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center bg-background overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-xl px-6 py-12", children: validLayers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-black uppercase tracking-tight", children: "ADD LAYERS TO START" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full aspect-square max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl shadow-2xl",
        style: {
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), inset 0 0 0 6px rgba(0, 0, 0, 0.6)"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-3 bg-[#0a0a0a] rounded-xl overflow-hidden flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "canvas",
          {
            ref: canvasRef,
            className: "w-full h-full object-contain rounded-lg",
            style: {
              imageRendering: pixelMode ? "pixelated" : "auto"
            }
          }
        ) })
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: shuffleTraits,
        disabled: isShuffling,
        className: "w-full max-w-md h-12 bg-[#666666] hover:bg-[#777777] disabled:bg-[#555555] text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all duration-200 smooth-hover disabled:opacity-70 disabled:cursor-not-allowed",
        style: {
          boxShadow: "0 6px 20px rgba(102, 102, 102, 0.4)"
        },
        children: isShuffling ? "GENERATING..." : "GENERATE RANDOM MIX"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-md bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a] smooth-transition", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "label",
          {
            htmlFor: "pixel-mode",
            className: "text-sm font-black text-white uppercase tracking-tight cursor-pointer",
            children: "HIGH FIDELITY PIXEL MODE"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-medium uppercase tracking-tight", children: "MAINTAIN SHARP EDGES" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Switch,
        {
          id: "pixel-mode",
          checked: pixelMode,
          onCheckedChange: handlePixelModeToggle,
          className: "data-[state=checked]:bg-[#888888] smooth-transition"
        }
      )
    ] }) })
  ] }) }) });
}
export {
  Preview as default
};
