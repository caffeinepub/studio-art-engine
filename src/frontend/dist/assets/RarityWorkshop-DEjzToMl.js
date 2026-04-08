import { c as createLucideIcon, r as reactExports, u as ue, j as jsxRuntimeExports, B as Button, L as Label } from "./index-pc9VbM7E.js";
import { C as Card, c as CardContent } from "./card-ao4MF0GX.js";
import { S as ScrollArea } from "./scroll-area-D32bQ35H.js";
import { S as Slider } from "./slider-DlsXYLYo.js";
import { L as Lock, a as LockOpen } from "./lock-DXs5Sw2E.js";
import "./index-BHuraKdI.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["line", { x1: "5", x2: "19", y1: "9", y2: "9", key: "1nwqeh" }],
  ["line", { x1: "5", x2: "19", y1: "15", y2: "15", key: "g8yjpy" }]
];
const Equal = createLucideIcon("equal", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "m18 14 4 4-4 4", key: "10pe0f" }],
  ["path", { d: "m18 2 4 4-4 4", key: "pucp1d" }],
  ["path", { d: "M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22", key: "1ailkh" }],
  ["path", { d: "M2 6h1.972a4 4 0 0 1 3.6 2.2", key: "km57vx" }],
  ["path", { d: "M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45", key: "os18l9" }]
];
const Shuffle = createLucideIcon("shuffle", __iconNode);
function RarityWorkshop({
  project,
  onUpdateProject
}) {
  const [selectedLayerId, setSelectedLayerId] = reactExports.useState(
    project.layers.length > 0 ? project.layers[0].id : null
  );
  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);
  reactExports.useEffect(() => {
    if (!selectedLayer || selectedLayer.traits.length === 0) return;
    const hasUninitializedWeights = selectedLayer.traits.some(
      (t) => typeof t.weight !== "number" || Number.isNaN(t.weight) || t.weight < 0
    );
    const totalWeight2 = selectedLayer.traits.reduce(
      (sum, t) => sum + (t.weight || 0),
      0
    );
    const needsInitialization = hasUninitializedWeights || Math.abs(totalWeight2) < 0.01;
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
              weight: i === 0 ? Number.parseFloat(
                (100 - equalWeight * (l.traits.length - 1)).toFixed(2)
              ) : Number.parseFloat(equalWeight.toFixed(2)),
              locked: false
            }))
          };
        })
      }));
    }
  }, [selectedLayer, onUpdateProject]);
  const normalizeWeights = reactExports.useCallback((traits) => {
    if (traits.length === 0) return traits;
    const validTraits = traits.map((t) => ({
      ...t,
      weight: typeof t.weight === "number" && !Number.isNaN(t.weight) && t.weight >= 0 ? t.weight : 0
    }));
    const total = validTraits.reduce((sum, t) => sum + t.weight, 0);
    if (total === 0) {
      const equalWeight = 100 / validTraits.length;
      return validTraits.map((t, i) => ({
        ...t,
        weight: i === 0 ? Number.parseFloat(
          (100 - equalWeight * (validTraits.length - 1)).toFixed(2)
        ) : Number.parseFloat(equalWeight.toFixed(2))
      }));
    }
    if (Math.abs(total - 100) < 0.01) return validTraits;
    const normalized = validTraits.map((t) => ({
      ...t,
      weight: Number.parseFloat((t.weight / total * 100).toFixed(2))
    }));
    const newTotal = normalized.reduce((sum, t) => sum + t.weight, 0);
    if (Math.abs(newTotal - 100) > 0.01) {
      const diff = Number.parseFloat((100 - newTotal).toFixed(2));
      normalized[0] = {
        ...normalized[0],
        weight: Number.parseFloat((normalized[0].weight + diff).toFixed(2))
      };
    }
    return normalized;
  }, []);
  const updateTraitWeight = reactExports.useCallback(
    (layerId, traitId, newWeight) => {
      if (typeof newWeight !== "number" || Number.isNaN(newWeight)) {
        ue.error("INVALID WEIGHT VALUE");
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
          if (Math.abs(delta) < 0.01) return l;
          traits[targetIndex] = {
            ...traits[targetIndex],
            weight: Number.parseFloat(clampedWeight.toFixed(2))
          };
          const unlockedTraits = traits.filter(
            (t, i) => i !== targetIndex && !t.locked
          );
          if (unlockedTraits.length === 0) {
            traits[targetIndex] = { ...traits[targetIndex], weight: oldWeight };
            ue.error("CANNOT ADJUST: ALL OTHER TRAITS LOCKED");
            return l;
          }
          const totalUnlockedWeight = unlockedTraits.reduce(
            (sum, t) => sum + (t.weight || 0),
            0
          );
          if (totalUnlockedWeight <= 0.01) {
            traits[targetIndex] = { ...traits[targetIndex], weight: oldWeight };
            ue.error("CANNOT ADJUST: INSUFFICIENT UNLOCKED WEIGHT");
            return l;
          }
          let remainingDelta = -delta;
          unlockedTraits.forEach((trait, i) => {
            const traitIndex = traits.findIndex((t) => t.id === trait.id);
            const proportion = (trait.weight || 0) / totalUnlockedWeight;
            let adjustment;
            if (i === unlockedTraits.length - 1) {
              adjustment = remainingDelta;
            } else {
              adjustment = Number.parseFloat((proportion * -delta).toFixed(2));
            }
            const newTraitWeight = Math.max(
              0,
              Math.min(100, (trait.weight || 0) + adjustment)
            );
            traits[traitIndex] = {
              ...traits[traitIndex],
              weight: Number.parseFloat(newTraitWeight.toFixed(2))
            };
            remainingDelta -= adjustment;
          });
          return { ...l, traits: normalizeWeights(traits) };
        })
      }));
    },
    [onUpdateProject, normalizeWeights]
  );
  const toggleLock = reactExports.useCallback(
    (layerId, traitId) => {
      onUpdateProject((p) => ({
        ...p,
        layers: p.layers.map((l) => {
          if (l.id !== layerId) return l;
          return {
            ...l,
            traits: l.traits.map(
              (t) => t.id === traitId ? { ...t, locked: !t.locked } : t
            )
          };
        })
      }));
    },
    [onUpdateProject]
  );
  const equalizeWeights = reactExports.useCallback(
    (layerId) => {
      onUpdateProject((p) => ({
        ...p,
        layers: p.layers.map((l) => {
          if (l.id !== layerId) return l;
          const equalWeight = Number.parseFloat(
            (100 / l.traits.length).toFixed(2)
          );
          const traits = l.traits.map((t, i) => ({
            ...t,
            weight: i === 0 ? Number.parseFloat(
              (100 - equalWeight * (l.traits.length - 1)).toFixed(2)
            ) : equalWeight,
            locked: false
          }));
          return { ...l, traits: normalizeWeights(traits) };
        })
      }));
      ue.success("WEIGHTS EQUALIZED");
    },
    [onUpdateProject, normalizeWeights]
  );
  const randomizeWeights = reactExports.useCallback(
    (layerId) => {
      onUpdateProject((p) => ({
        ...p,
        layers: p.layers.map((l) => {
          if (l.id !== layerId) return l;
          const randomWeights = l.traits.map(() => Math.random() + 0.1);
          const total = randomWeights.reduce((sum, w) => sum + w, 0);
          const traits = l.traits.map((t, i) => ({
            ...t,
            weight: Number.parseFloat(
              (randomWeights[i] / total * 100).toFixed(2)
            ),
            locked: false
          }));
          return { ...l, traits: normalizeWeights(traits) };
        })
      }));
      ue.success("WEIGHTS RANDOMIZED");
    },
    [onUpdateProject, normalizeWeights]
  );
  const calculateExpectedCount = reactExports.useCallback(
    (weight) => {
      if (typeof weight !== "number" || Number.isNaN(weight)) return 0;
      return Math.round(weight / 100 * project.collectionSize);
    },
    [project.collectionSize]
  );
  const isRare = reactExports.useCallback((weight) => {
    return typeof weight === "number" && !Number.isNaN(weight) && weight < 1;
  }, []);
  const totalWeight = reactExports.useMemo(() => {
    if (!selectedLayer) return 0;
    return selectedLayer.traits.reduce((sum, t) => sum + (t.weight || 0), 0);
  }, [selectedLayer]);
  if (project.layers.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-4 border-2 border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-black", children: "+" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black tracking-tight uppercase text-muted-foreground", children: "NO LAYERS AVAILABLE" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2 font-bold", children: "Create layers in the Workshop first" })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-72 border-r-2 border-border bg-card flex flex-col flex-shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b-2 border-border flex-shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-black text-muted-foreground mb-3 uppercase tracking-tight", children: "LAYER SELECTION" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-bold", children: [
          project.layers.length,
          " Layer",
          project.layers.length !== 1 ? "s" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 space-y-2", children: project.layers.map((layer) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => setSelectedLayerId(layer.id),
          className: `w-full p-3 border-2 transition-all text-left ${selectedLayerId === layer.id ? "bg-muted border-primary sharp-shadow" : "bg-card border-border hover:border-muted-foreground"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-xs text-foreground truncate uppercase tracking-tight", children: layer.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-bold mt-1", children: [
              layer.traits.length,
              " Trait",
              layer.traits.length !== 1 ? "s" : ""
            ] })
          ]
        },
        layer.id
      )) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto bg-background", children: !selectedLayer ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black tracking-tight uppercase", children: "SELECT A LAYER" }) }) }) : selectedLayer.traits.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black tracking-tight uppercase", children: "NO TRAITS IN LAYER" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2 font-bold", children: "Add traits in the Workshop first" })
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-5xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black text-foreground uppercase tracking-tight", children: selectedLayer.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground font-bold mt-1", children: [
              selectedLayer.traits.length,
              " Traits • Total:",
              " ",
              totalWeight.toFixed(2),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: () => equalizeWeights(selectedLayer.id),
                variant: "outline",
                size: "sm",
                className: "font-black uppercase tracking-tight border-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Equal, { className: "w-4 h-4 mr-2" }),
                  "EQUALIZE ALL"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: () => randomizeWeights(selectedLayer.id),
                variant: "outline",
                size: "sm",
                className: "font-black uppercase tracking-tight border-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Shuffle, { className: "w-4 h-4 mr-2" }),
                  "RANDOMIZE"
                ]
              }
            )
          ] })
        ] }),
        Math.abs(totalWeight - 100) > 0.01 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-destructive/10 border-2 border-destructive text-destructive text-sm font-bold", children: [
          "⚠ TOTAL WEIGHT: ",
          totalWeight.toFixed(2),
          "% (Should be 100.00%)"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: selectedLayer.traits.map((trait) => {
        const expectedCount = calculateExpectedCount(trait.weight);
        const rare = isRare(trait.weight);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Card,
          {
            className: `bg-card border-2 transition-all ${rare ? "border-yellow-500 animate-pulse-subtle" : "border-border"}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `w-20 h-20 bg-muted border-2 flex-shrink-0 overflow-hidden ${rare ? "border-yellow-500" : "border-border"}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: trait.imageData,
                      alt: trait.name,
                      className: "w-full h-full object-contain",
                      style: {
                        imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                      }
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-sm text-foreground truncate uppercase tracking-tight", children: trait.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-bold mt-1", children: [
                      "Expected: ",
                      expectedCount,
                      " /",
                      " ",
                      project.collectionSize,
                      " items"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => toggleLock(selectedLayer.id, trait.id),
                      className: `flex items-center gap-1 px-2 py-1 border-2 transition-all ${trait.locked ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-muted-foreground"}`,
                      children: [
                        trait.locked ? /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-3 h-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(LockOpen, { className: "w-3 h-3" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase", children: trait.locked ? "LOCKED" : "LOCK" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground font-bold uppercase tracking-tight", children: "RARITY WEIGHT" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "span",
                    {
                      className: `text-sm font-black transition-all ${rare ? "text-yellow-500" : "text-foreground"}`,
                      children: [
                        (trait.weight || 0).toFixed(2),
                        "%"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Slider,
                    {
                      value: [trait.weight || 0],
                      onValueChange: ([value]) => updateTraitWeight(
                        selectedLayer.id,
                        trait.id,
                        value
                      ),
                      min: 0,
                      max: 100,
                      step: 0.01,
                      disabled: trait.locked,
                      className: "w-full rarity-slider"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "absolute inset-0 pointer-events-none rounded-full",
                      style: {
                        background: "linear-gradient(to right, #7c3aed 0%, #0d9488 100%)",
                        opacity: 0.2,
                        height: "8px",
                        top: "50%",
                        transform: "translateY(-50%)"
                      }
                    }
                  )
                ] }),
                rare && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-xs font-bold text-yellow-500 uppercase tracking-tight", children: "⚠ RARE TRAIT (<1%)" })
              ] })
            ] }) })
          },
          trait.id
        );
      }) })
    ] }) }) })
  ] });
}
export {
  RarityWorkshop as default
};
