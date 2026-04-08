import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, B as Button, X, D as Dialog, a as DialogContent, u as ue } from "./index-pc9VbM7E.js";
import { S as ScrollArea } from "./scroll-area-D32bQ35H.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
const Copy = createLucideIcon("copy", __iconNode);
function Rules({ project, onUpdateProject }) {
  const [isAddRuleOpen, setIsAddRuleOpen] = reactExports.useState(false);
  const [isEditMode, setIsEditMode] = reactExports.useState(false);
  const [editingRuleId, setEditingRuleId] = reactExports.useState(null);
  const [ruleType, setRuleType] = reactExports.useState("exclude");
  const [primaryTrait, setPrimaryTrait] = reactExports.useState(null);
  const [selectedIncompatibleTraits, setSelectedIncompatibleTraits] = reactExports.useState(/* @__PURE__ */ new Set());
  const validLayers = reactExports.useMemo(
    () => project.layers.filter((l) => l.traits.length > 0),
    [project.layers]
  );
  const resetForm = () => {
    setRuleType("exclude");
    setPrimaryTrait(null);
    setSelectedIncompatibleTraits(/* @__PURE__ */ new Set());
    setIsEditMode(false);
    setEditingRuleId(null);
  };
  const openAddRuleModal = () => {
    resetForm();
    setIsAddRuleOpen(true);
  };
  const openEditRuleModal = (rule) => {
    setIsEditMode(true);
    setEditingRuleId(rule.id);
    setRuleType(rule.type);
    setPrimaryTrait({
      layerId: rule.primaryTrait.layerId,
      traitId: rule.primaryTrait.traitId
    });
    const incompatibleSet = /* @__PURE__ */ new Set();
    for (const trait of rule.incompatibleTraits) {
      incompatibleSet.add(`${trait.layerId}:${trait.traitId}`);
    }
    setSelectedIncompatibleTraits(incompatibleSet);
    setIsAddRuleOpen(true);
  };
  const duplicateRule = (rule) => {
    const newRule = {
      id: Date.now().toString(),
      type: rule.type,
      primaryTrait: { ...rule.primaryTrait },
      incompatibleTraits: rule.incompatibleTraits.map((t) => ({ ...t }))
    };
    onUpdateProject((p) => ({
      ...p,
      rules: [...p.rules, newRule]
    }));
    ue.success("RULE DUPLICATED");
  };
  const addOrUpdateRule = () => {
    if (!primaryTrait || selectedIncompatibleTraits.size === 0) {
      ue.error("SELECT PRIMARY AND INCOMPATIBLE TRAITS");
      return;
    }
    const incompatibleTraits = Array.from(selectedIncompatibleTraits).map(
      (key) => {
        const [layerId, traitId] = key.split(":");
        return { layerId, traitId };
      }
    );
    const hasSelfReference = incompatibleTraits.some(
      (trait) => trait.layerId === primaryTrait.layerId && trait.traitId === primaryTrait.traitId
    );
    if (hasSelfReference) {
      ue.error("CANNOT USE SAME TRAIT");
      return;
    }
    if (isEditMode && editingRuleId) {
      onUpdateProject((p) => ({
        ...p,
        rules: p.rules.map(
          (r) => r.id === editingRuleId ? {
            ...r,
            type: ruleType,
            primaryTrait: {
              layerId: primaryTrait.layerId,
              traitId: primaryTrait.traitId
            },
            incompatibleTraits
          } : r
        )
      }));
      ue.success("RULE UPDATED");
    } else {
      const newRule = {
        id: Date.now().toString(),
        type: ruleType,
        primaryTrait: {
          layerId: primaryTrait.layerId,
          traitId: primaryTrait.traitId
        },
        incompatibleTraits
      };
      onUpdateProject((p) => ({
        ...p,
        rules: [...p.rules, newRule]
      }));
      ue.success("RULE ADDED");
    }
    setIsAddRuleOpen(false);
    resetForm();
  };
  const deleteRule = (ruleId) => {
    onUpdateProject((p) => ({
      ...p,
      rules: p.rules.filter((r) => r.id !== ruleId)
    }));
    ue.success("RULE DELETED");
  };
  const getTraitInfo = (layerId, traitId) => {
    const layer = project.layers.find((l) => l.id === layerId);
    if (!layer) return null;
    const trait = layer.traits.find((t) => t.id === traitId);
    if (!trait) return null;
    return {
      name: trait.name,
      imageData: trait.imageData,
      layerName: layer.name
    };
  };
  const togglePrimaryTrait = (layerId, traitId) => {
    if ((primaryTrait == null ? void 0 : primaryTrait.layerId) === layerId && (primaryTrait == null ? void 0 : primaryTrait.traitId) === traitId) {
      setPrimaryTrait(null);
    } else {
      setPrimaryTrait({ layerId, traitId });
    }
  };
  const toggleIncompatibleTrait = (key) => {
    const newSet = new Set(selectedIncompatibleTraits);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedIncompatibleTraits(newSet);
  };
  const isTraitDimmed = (layerId) => {
    return primaryTrait && layerId === primaryTrait.layerId;
  };
  const getPrimaryTraitDisplay = () => {
    if (!primaryTrait) return "SELECT A TRAIT";
    const info = getTraitInfo(primaryTrait.layerId, primaryTrait.traitId);
    return info ? info.name.toUpperCase() : "UNKNOWN";
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-8 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black text-foreground uppercase tracking-tight", children: "MATCHING RULES" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: "🚫" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Make sure items look good together. E.g. don't wear a hat with a helmet!" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: openAddRuleModal,
            disabled: validLayers.length < 2,
            className: "bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tight px-6 h-12 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all",
            children: "+ NEW RULE"
          }
        )
      ] }),
      validLayers.length < 2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-card/50 border border-border rounded-lg p-16 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-bold uppercase tracking-tight", children: "NEED AT LEAST 2 LAYERS WITH TRAITS TO CREATE RULES" }) }) : project.rules.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-card/50 border border-border rounded-lg p-16 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-bold uppercase tracking-tight", children: 'NO RULES YET. CLICK "+ NEW RULE" TO GET STARTED' }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: project.rules.map((rule) => {
        const primaryInfo = getTraitInfo(
          rule.primaryTrait.layerId,
          rule.primaryTrait.traitId
        );
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "bg-[#1a1a1a] border border-border/50 rounded-xl p-6 hover:border-border transition-all group",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2", children: (primaryInfo == null ? void 0 : primaryInfo.layerName) || "UNKNOWN" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-black text-foreground uppercase tracking-tight", children: (primaryInfo == null ? void 0 : primaryInfo.name) || "UNKNOWN TRAIT" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 flex-shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  rule.incompatibleTraits.slice(0, 4).map((trait) => {
                    const traitInfo = getTraitInfo(
                      trait.layerId,
                      trait.traitId
                    );
                    if (!traitInfo) return null;
                    return /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "w-12 h-12 bg-background border border-border rounded overflow-hidden",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "img",
                          {
                            src: traitInfo.imageData,
                            alt: traitInfo.name,
                            className: "w-full h-full object-contain",
                            style: {
                              imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                            }
                          }
                        )
                      },
                      `${trait.layerId}-${trait.traitId}`
                    );
                  }),
                  rule.incompatibleTraits.length > 4 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 bg-background border border-border rounded flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-black text-muted-foreground", children: [
                    "+",
                    rule.incompatibleTraits.length - 4
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    className: `px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-tight transition-all ${rule.type === "exclude" ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30" : "bg-teal-500/20 text-teal-400 border border-teal-500/50 hover:bg-teal-500/30"}`,
                    children: rule.type === "exclude" ? "CAN'T WEAR" : "MUST WEAR"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => duplicateRule(rule),
                      className: "w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded transition-colors",
                      title: "Duplicate rule",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => openEditRuleModal(rule),
                      className: "w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded transition-colors",
                      title: "Edit rule",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base font-black", children: "✎" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => deleteRule(rule.id),
                      className: "w-8 h-8 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded transition-colors",
                      title: "Delete rule",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                    }
                  )
                ] })
              ] })
            ] })
          },
          rule.id
        );
      }) })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Dialog,
      {
        open: isAddRuleOpen,
        onOpenChange: (open) => {
          setIsAddRuleOpen(open);
          if (!open) resetForm();
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "bg-[#1a1a1a] border-2 border-border w-[900px] max-w-[90vw] h-[700px] max-h-[85vh] p-0 flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 px-8 pt-6 pb-4 border-b border-border/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-black text-foreground uppercase tracking-tight", children: isEditMode ? "EDIT RULE" : "SET A RULE" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setIsAddRuleOpen(false),
                  className: "text-muted-foreground hover:text-foreground transition-colors",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setRuleType("exclude"),
                  className: `flex-1 px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-tight transition-all ${ruleType === "exclude" ? "bg-destructive text-destructive-foreground shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "bg-muted text-muted-foreground hover:bg-muted/80"}`,
                  children: "DON'T MATCH"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setRuleType("force"),
                  className: `flex-1 px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-tight transition-all ${ruleType === "force" ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(139,92,246,0.5)]" : "bg-muted text-muted-foreground hover:bg-muted/80"}`,
                  children: "MUST MATCH"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 grid grid-cols-2 gap-0 overflow-hidden min-h-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-r border-border/50 flex flex-col min-h-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 px-6 py-4 border-b border-border/50", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground font-bold uppercase tracking-tight mb-1", children: "WHEN I PICK..." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-base font-black text-foreground uppercase tracking-tight", children: getPrimaryTraitDisplay() })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1 min-h-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 space-y-6", children: validLayers.map((layer) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-muted-foreground uppercase tracking-tight mb-3", children: layer.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-3", children: layer.traits.map((trait) => {
                  const isSelected = (primaryTrait == null ? void 0 : primaryTrait.layerId) === layer.id && (primaryTrait == null ? void 0 : primaryTrait.traitId) === trait.id;
                  return /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => togglePrimaryTrait(layer.id, trait.id),
                      className: `aspect-square bg-background border-2 overflow-hidden transition-all duration-200 ease-in-out group/trait ${isSelected ? "border-primary shadow-[0_0_15px_rgba(139,92,246,0.4)]" : "border-border hover:border-primary/50 hover:shadow-[0_0_12px_rgba(139,92,246,0.25)]"}`,
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: trait.imageData,
                          alt: trait.name,
                          className: "w-full h-full object-contain transition-transform duration-200 ease-in-out group-hover/trait:scale-110",
                          style: {
                            imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                          }
                        }
                      ) })
                    },
                    trait.id
                  );
                }) })
              ] }, layer.id)) }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-h-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 px-6 py-4 border-b border-border/50", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground font-bold uppercase tracking-tight mb-1", children: ruleType === "exclude" ? "I CAN'T WEAR..." : "I MUST WEAR..." }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-base font-black text-foreground uppercase tracking-tight", children: [
                  selectedIncompatibleTraits.size,
                  " STYLES"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1 min-h-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 space-y-6", children: validLayers.map((layer) => {
                const isDimmed = isTraitDimmed(layer.id);
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: isDimmed ? "opacity-40" : "",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-muted-foreground uppercase tracking-tight mb-3", children: layer.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-3", children: layer.traits.map((trait) => {
                        const key = `${layer.id}:${trait.id}`;
                        const isSelected = selectedIncompatibleTraits.has(key);
                        return /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => toggleIncompatibleTrait(key),
                            className: `aspect-square bg-background border-2 overflow-hidden transition-all duration-200 ease-in-out group/trait ${isSelected ? "border-primary shadow-[0_0_15px_rgba(139,92,246,0.4)]" : "border-border hover:border-primary/50 hover:shadow-[0_0_12px_rgba(139,92,246,0.25)]"}`,
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "img",
                              {
                                src: trait.imageData,
                                alt: trait.name,
                                className: "w-full h-full object-contain transition-transform duration-200 ease-in-out group-hover/trait:scale-110",
                                style: {
                                  imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                                }
                              }
                            ) })
                          },
                          trait.id
                        );
                      }) })
                    ]
                  },
                  layer.id
                );
              }) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 px-8 py-5 border-t border-border/50 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setIsAddRuleOpen(false),
                className: "text-sm text-muted-foreground hover:text-foreground font-bold uppercase tracking-tight transition-colors",
                children: "CANCEL"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                onClick: addOrUpdateRule,
                disabled: !primaryTrait || selectedIncompatibleTraits.size === 0,
                className: "bg-primary text-primary-foreground font-black uppercase tracking-tight px-8 py-2.5 shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all",
                children: "SAVE THIS RULE"
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
export {
  Rules as default
};
