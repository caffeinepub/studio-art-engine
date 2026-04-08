import { c as createLucideIcon, r as reactExports, u as ue, j as jsxRuntimeExports, B as Button, I as Input, X, L as Label, D as Dialog, a as DialogContent, b as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./index-pc9VbM7E.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-ao4MF0GX.js";
import { S as ScrollArea } from "./scroll-area-D32bQ35H.js";
import { C as Check, S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DTc9TCj-.js";
import { S as Slider } from "./slider-DlsXYLYo.js";
import "./index-BHuraKdI.js";
import "./chevron-down-D7GD2-2C.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ]
];
const Pen = createLucideIcon("pen", __iconNode);
function Workshop({ project, onUpdateProject }) {
  const [selectedLayerId, setSelectedLayerId] = reactExports.useState(null);
  const [isAddLayerOpen, setIsAddLayerOpen] = reactExports.useState(false);
  const [newLayerName, setNewLayerName] = reactExports.useState("");
  const [draggedLayerId, setDraggedLayerId] = reactExports.useState(null);
  const [editingLayerId, setEditingLayerId] = reactExports.useState(null);
  const [editingLayerName, setEditingLayerName] = reactExports.useState("");
  const [editingTraitId, setEditingTraitId] = reactExports.useState(null);
  const [editingTraitName, setEditingTraitName] = reactExports.useState("");
  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);
  const addLayer = () => {
    if (!newLayerName.trim()) {
      ue.error("ENTER LAYER NAME");
      return;
    }
    const newLayer = {
      id: Date.now().toString(),
      name: newLayerName,
      traits: [],
      opacity: 100,
      blendMode: "normal"
    };
    onUpdateProject((p) => ({
      ...p,
      layers: [...p.layers, newLayer]
    }));
    setNewLayerName("");
    setIsAddLayerOpen(false);
    setSelectedLayerId(newLayer.id);
    ue.success("LAYER ADDED");
  };
  const deleteLayer = (layerId) => {
    onUpdateProject((p) => ({
      ...p,
      layers: p.layers.filter((l) => l.id !== layerId),
      // Preserve rules but clear references to deleted layer
      rules: p.rules.map((r) => {
        if (r.primaryTrait.layerId === layerId) {
          return null;
        }
        const filteredIncompatibleTraits = r.incompatibleTraits.filter(
          (trait) => trait.layerId !== layerId
        );
        if (filteredIncompatibleTraits.length === 0) {
          return null;
        }
        return {
          ...r,
          incompatibleTraits: filteredIncompatibleTraits
        };
      }).filter((r) => r !== null)
    }));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
    ue.success("LAYER DELETED");
  };
  const updateLayer = (layerId, updates) => {
    onUpdateProject((p) => ({
      ...p,
      layers: p.layers.map(
        (l) => l.id === layerId ? { ...l, ...updates } : l
      )
    }));
  };
  const startEditingLayer = (layer) => {
    setEditingLayerId(layer.id);
    setEditingLayerName(layer.name);
  };
  const saveLayerName = () => {
    if (!editingLayerId || !editingLayerName.trim()) {
      ue.error("ENTER VALID NAME");
      return;
    }
    updateLayer(editingLayerId, { name: editingLayerName.trim() });
    setEditingLayerId(null);
    setEditingLayerName("");
    ue.success("LAYER RENAMED");
  };
  const cancelEditingLayer = () => {
    setEditingLayerId(null);
    setEditingLayerName("");
  };
  const startEditingTrait = (trait) => {
    setEditingTraitId(trait.id);
    setEditingTraitName(trait.name);
  };
  const saveTraitName = (layerId) => {
    if (!editingTraitId || !editingTraitName.trim()) {
      ue.error("ENTER VALID NAME");
      return;
    }
    onUpdateProject((p) => ({
      ...p,
      layers: p.layers.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          traits: l.traits.map(
            (t) => t.id === editingTraitId ? { ...t, name: editingTraitName.trim() } : t
          )
        };
      })
    }));
    setEditingTraitId(null);
    setEditingTraitName("");
    ue.success("TRAIT RENAMED");
  };
  const cancelEditingTrait = () => {
    setEditingTraitId(null);
    setEditingTraitName("");
  };
  const handleFileUpload = reactExports.useCallback(
    async (layerId, files) => {
      if (!files || files.length === 0) return;
      const newTraits = [];
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        if (!file.type.startsWith("image/")) {
          ue.error(`SKIPPED: ${file.name} (NOT AN IMAGE)`);
          continue;
        }
        try {
          const reader = new FileReader();
          await new Promise((resolve, reject) => {
            reader.onload = (e) => {
              var _a;
              const imageData = (_a = e.target) == null ? void 0 : _a.result;
              const traitName = file.name.replace(/\.[^/.]+$/, "");
              newTraits.push({
                id: `${Date.now()}-${Math.random()}`,
                name: traitName,
                imageData,
                weight: 0
              });
              resolve();
            };
            reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
            reader.readAsDataURL(file);
          });
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
          ue.error(`ERROR READING: ${file.name}`);
        }
      }
      if (newTraits.length === 0) {
        ue.error("NO VALID IMAGES");
        return;
      }
      onUpdateProject((p) => ({
        ...p,
        layers: p.layers.map((l) => {
          if (l.id !== layerId) return l;
          return {
            ...l,
            traits: [...l.traits, ...newTraits]
          };
        })
      }));
      ue.success(
        `${newTraits.length} TRAIT${newTraits.length > 1 ? "S" : ""} ADDED`
      );
    },
    [onUpdateProject]
  );
  const deleteTrait = (layerId, traitId) => {
    onUpdateProject((p) => ({
      ...p,
      layers: p.layers.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          traits: l.traits.filter((t) => t.id !== traitId)
        };
      }),
      // Preserve rules but clear references to deleted trait
      rules: p.rules.map((r) => {
        if (r.primaryTrait.layerId === layerId && r.primaryTrait.traitId === traitId) {
          return null;
        }
        const filteredIncompatibleTraits = r.incompatibleTraits.filter(
          (trait) => !(trait.layerId === layerId && trait.traitId === traitId)
        );
        if (filteredIncompatibleTraits.length === 0) {
          return null;
        }
        return {
          ...r,
          incompatibleTraits: filteredIncompatibleTraits
        };
      }).filter((r) => r !== null)
    }));
    ue.success("TRAIT DELETED");
  };
  const handleDragStart = (layerId) => {
    setDraggedLayerId(layerId);
  };
  const handleDragOver = (e, targetLayerId) => {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-72 border-r-2 border-border bg-card flex flex-col flex-shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b-2 border-border flex-shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-black text-muted-foreground mb-3 uppercase tracking-tight", children: "LAYERS" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: () => setIsAddLayerOpen(true),
            className: "w-full bg-primary text-primary-foreground font-black sharp-shadow uppercase tracking-tight",
            size: "sm",
            children: "ADD LAYER"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 space-y-2", children: project.layers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-12 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-tight", children: "NO LAYERS" }) }) : project.layers.map((layer) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          draggable: editingLayerId !== layer.id,
          onDragStart: () => handleDragStart(layer.id),
          onDragOver: (e) => handleDragOver(e, layer.id),
          onDragEnd: handleDragEnd,
          className: `p-3 border-2 transition-all group ${selectedLayerId === layer.id ? "bg-muted border-primary sharp-shadow" : "bg-card border-border hover:border-muted-foreground"} ${editingLayerId === layer.id ? "" : "cursor-move"}`,
          onClick: () => editingLayerId !== layer.id && setSelectedLayerId(layer.id),
          onKeyUp: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              editingLayerId !== layer.id && setSelectedLayerId(layer.id);
            }
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
            editingLayerId !== layer.id && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black text-muted-foreground mt-0.5 flex-shrink-0", children: "≡" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: editingLayerId === layer.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: editingLayerName,
                  onChange: (e) => setEditingLayerName(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === "Enter") saveLayerName();
                    if (e.key === "Escape") cancelEditingLayer();
                  },
                  className: "h-7 text-xs font-black uppercase tracking-tight bg-background border-primary",
                  autoFocus: true,
                  onClick: (e) => e.stopPropagation()
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: (e) => {
                    e.stopPropagation();
                    saveLayerName();
                  },
                  className: "text-accent hover:text-accent/80 flex-shrink-0",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: (e) => {
                    e.stopPropagation();
                    cancelEditingLayer();
                  },
                  className: "text-muted-foreground hover:text-foreground flex-shrink-0",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                }
              )
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-xs text-foreground truncate uppercase tracking-tight flex-1", children: layer.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: (e) => {
                      e.stopPropagation();
                      startEditingLayer(layer);
                    },
                    className: "text-muted-foreground hover:text-primary transition-colors flex-shrink-0",
                    title: "Rename layer",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "w-3 h-3" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-bold", children: [
                layer.traits.length,
                " trait",
                layer.traits.length !== 1 ? "s" : ""
              ] })
            ] }) }),
            editingLayerId !== layer.id && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: (e) => {
                  e.stopPropagation();
                  deleteLayer(layer.id);
                },
                className: "text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 flex-shrink-0",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black", children: "×" })
              }
            )
          ] })
        },
        layer.id
      )) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto bg-background", children: !selectedLayer ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-4 border-2 border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-black", children: "+" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black tracking-tight uppercase", children: "SELECT LAYER" })
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black mb-1 text-foreground uppercase tracking-tight", children: selectedLayer.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-bold", children: "Manage traits and layer settings. Adjust rarity weights in the Rarity Workshop." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-card border-2 border-border sharp-shadow", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm text-foreground font-black uppercase tracking-tight", children: "SETTINGS" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-sm text-foreground font-bold uppercase tracking-tight", children: [
                "OPACITY ",
                selectedLayer.opacity,
                "%"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Slider,
                {
                  value: [selectedLayer.opacity],
                  onValueChange: ([value]) => updateLayer(selectedLayer.id, { opacity: value }),
                  min: 0,
                  max: 100,
                  step: 1,
                  className: "transition-all"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-foreground font-bold uppercase tracking-tight", children: "BLEND" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: selectedLayer.blendMode,
                  onValueChange: (value) => updateLayer(selectedLayer.id, { blendMode: value }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-background border-2 border-border font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "bg-card border-2 border-border", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "normal", children: "NORMAL" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "multiply", children: "MULTIPLY" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "overlay", children: "OVERLAY" })
                    ] })
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-base font-black text-foreground uppercase tracking-tight", children: [
            "TRAITS (",
            selectedLayer.traits.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => {
                var _a;
                return (_a = document.getElementById(`file-${selectedLayer.id}`)) == null ? void 0 : _a.click();
              },
              className: "bg-primary text-primary-foreground font-black sharp-shadow uppercase tracking-tight",
              size: "sm",
              children: "ADD TRAITS"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              id: `file-${selectedLayer.id}`,
              type: "file",
              multiple: true,
              accept: "image/*",
              className: "hidden",
              onChange: (e) => handleFileUpload(selectedLayer.id, e.target.files)
            }
          )
        ] }),
        selectedLayer.traits.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-2 border-border sharp-shadow", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-12 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-black uppercase tracking-tight", children: "NO TRAITS" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-bold mt-2", children: "Upload images to add traits" })
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: selectedLayer.traits.map((trait) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          Card,
          {
            className: "bg-card border-2 border-border sharp-shadow-hover transition-all group",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 bg-muted border-2 border-border flex-shrink-0 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: trait.imageData,
                  alt: trait.name,
                  className: "w-full h-full object-contain",
                  style: {
                    imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                  }
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: editingTraitId === trait.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: editingTraitName,
                    onChange: (e) => setEditingTraitName(e.target.value),
                    onKeyDown: (e) => {
                      if (e.key === "Enter")
                        saveTraitName(selectedLayer.id);
                      if (e.key === "Escape")
                        cancelEditingTrait();
                    },
                    className: "h-7 text-xs font-black uppercase tracking-tight bg-background border-primary",
                    autoFocus: true
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => saveTraitName(selectedLayer.id),
                    className: "text-accent hover:text-accent/80 flex-shrink-0",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: cancelEditingTrait,
                    className: "text-muted-foreground hover:text-foreground flex-shrink-0",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-sm text-foreground truncate uppercase tracking-tight flex-1", children: trait.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => startEditingTrait(trait),
                      className: "text-muted-foreground hover:text-primary transition-colors",
                      title: "Rename trait",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "w-3 h-3" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      onClick: () => deleteTrait(selectedLayer.id, trait.id),
                      className: "text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black", children: "×" })
                    }
                  )
                ] })
              ] }) })
            ] }) })
          },
          trait.id
        )) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isAddLayerOpen, onOpenChange: setIsAddLayerOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "bg-card border-2 border-border sharp-shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-foreground font-black uppercase tracking-tight", children: "NEW LAYER" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-muted-foreground font-bold uppercase tracking-tight text-xs", children: "CREATE LAYER" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Label,
          {
            htmlFor: "layerName",
            className: "text-foreground font-bold uppercase tracking-tight text-xs",
            children: "NAME"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "layerName",
            value: newLayerName,
            onChange: (e) => setNewLayerName(e.target.value),
            placeholder: "LAYER NAME",
            className: "bg-background border-2 border-border mt-2 font-bold",
            onKeyDown: (e) => e.key === "Enter" && addLayer()
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: addLayer,
          className: "bg-primary text-primary-foreground font-black sharp-shadow uppercase tracking-tight",
          children: "ADD"
        }
      ) })
    ] }) })
  ] });
}
export {
  Workshop as default
};
