import { r as reactExports, j as jsxRuntimeExports, B as Button, T as Trash2, A as AlertDialog, o as AlertDialogContent, p as AlertDialogHeader, q as AlertDialogTitle, s as AlertDialogDescription, t as AlertDialogFooter, v as AlertDialogCancel, w as AlertDialogAction, X, u as ue } from "./index-pc9VbM7E.js";
async function processForgeImage(imageDataUrl, options) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        canvas.width = options.outputSize;
        canvas.height = options.outputSize;
        if (options.pixelArtMode) {
          ctx.imageSmoothingEnabled = false;
        }
        const scale = Math.max(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          offsetX,
          offsetY,
          scaledWidth,
          scaledHeight
        );
        const processedDataUrl = canvas.toDataURL("image/png");
        resolve(processedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = imageDataUrl;
  });
}
function Builder({ project, onUpdateProject }) {
  const [isForgeOpen, setIsForgeOpen] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState("genesis");
  const [selectedTraits, setSelectedTraits] = reactExports.useState(
    {}
  );
  const [uploadQueue, setUploadQueue] = reactExports.useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = reactExports.useState(false);
  const [tokenToDelete, setTokenToDelete] = reactExports.useState(null);
  const [isProcessing, setIsProcessing] = reactExports.useState(false);
  const previewCanvasRef = reactExports.useRef(null);
  const fileInputRef = reactExports.useRef(null);
  const validLayers = project.layers.filter((l) => l.traits.length > 0);
  const getRandomTokenNumber = reactExports.useCallback(() => {
    const usedNumbers = new Set(project.generatedNFTs.map((nft) => nft.id));
    const maxAttempts = project.collectionSize * 2;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const randomNum = Math.floor(Math.random() * project.collectionSize) + 1;
      if (!usedNumbers.has(randomNum)) {
        return randomNum;
      }
      attempts++;
    }
    for (let i = 1; i <= project.collectionSize; i++) {
      if (!usedNumbers.has(i)) {
        return i;
      }
    }
    return project.collectionSize + 1;
  }, [project.generatedNFTs, project.collectionSize]);
  const renderGenesisPreview = reactExports.useCallback(async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || activeTab !== "genesis") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = project.settings.outputSize;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (project.pixelArtMode) {
      ctx.imageSmoothingEnabled = false;
    }
    for (let i = validLayers.length - 1; i >= 0; i--) {
      const layer = validLayers[i];
      const traitId = selectedTraits[layer.id];
      if (!traitId) continue;
      const trait = layer.traits.find((t) => t.id === traitId);
      if (!trait) continue;
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.save();
          ctx.globalAlpha = layer.opacity / 100;
          ctx.globalCompositeOperation = layer.blendMode;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = trait.imageData;
      });
    }
  }, [
    selectedTraits,
    activeTab,
    validLayers,
    project.pixelArtMode,
    project.settings.outputSize
  ]);
  reactExports.useEffect(() => {
    if (activeTab === "genesis" && Object.keys(selectedTraits).length > 0) {
      renderGenesisPreview();
    }
  }, [selectedTraits, activeTab, renderGenesisPreview]);
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files) return;
    setIsProcessing(true);
    try {
      const processedItems = [];
      for (const file of Array.from(files)) {
        const validTypes = [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/gif"
        ];
        if (!validTypes.includes(file.type)) {
          ue.error(`UNSUPPORTED FORMAT: ${file.name}`);
          continue;
        }
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            var _a;
            return resolve((_a = event.target) == null ? void 0 : _a.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const processedDataUrl = await processForgeImage(dataUrl, {
          outputSize: project.settings.outputSize,
          pixelArtMode: project.pixelArtMode
        });
        processedItems.push({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          data: processedDataUrl
        });
      }
      setUploadQueue((prev) => [...prev, ...processedItems]);
    } catch (error) {
      ue.error("IMAGE PROCESSING FAILED");
      console.error("Image processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  const removeFromQueue = (id) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };
  const confirmDeleteToken = (token) => {
    setTokenToDelete(token);
    setDeleteConfirmOpen(true);
  };
  const deleteForgedToken = () => {
    if (!tokenToDelete) return;
    onUpdateProject((p) => ({
      ...p,
      customTokens: p.customTokens.filter((t) => t.id !== tokenToDelete.id),
      generatedNFTs: p.generatedNFTs.filter(
        (nft) => nft.forgedTokenId !== tokenToDelete.id
      )
    }));
    ue.success("FORGED TOKEN DELETED");
    setDeleteConfirmOpen(false);
    setTokenToDelete(null);
  };
  const mintToVault = async () => {
    if (Object.keys(selectedTraits).length !== validLayers.length) {
      ue.error("SELECT ALL TRAITS");
      return;
    }
    const canvas = document.createElement("canvas");
    const size = project.settings.outputSize;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      ue.error("CANVAS ERROR");
      return;
    }
    if (project.pixelArtMode) {
      ctx.imageSmoothingEnabled = false;
    }
    for (let i = validLayers.length - 1; i >= 0; i--) {
      const layer = validLayers[i];
      const traitId = selectedTraits[layer.id];
      if (!traitId) continue;
      const trait = layer.traits.find((t) => t.id === traitId);
      if (!trait) continue;
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.save();
          ctx.globalAlpha = layer.opacity / 100;
          ctx.globalCompositeOperation = layer.blendMode;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = trait.imageData;
      });
    }
    const imageData = canvas.toDataURL("image/png");
    const tokenNumber = getRandomTokenNumber();
    const newToken = {
      id: Date.now().toString(),
      name: `Genesis #${project.customTokens.length + 1}`,
      type: "genesis",
      traits: Object.entries(selectedTraits).map(([layerId, traitId]) => ({
        layerId,
        traitId
      })),
      imageData,
      tokenNumber
    };
    onUpdateProject((p) => ({
      ...p,
      customTokens: [...p.customTokens, newToken]
    }));
    setIsForgeOpen(false);
    setSelectedTraits({});
    ue.success(`MINTED TO VAULT AS #${tokenNumber}`);
  };
  const authorizeInjection = () => {
    if (uploadQueue.length === 0) {
      ue.error("QUEUE IS EMPTY");
      return;
    }
    const newTokens = uploadQueue.map((item, index) => {
      const tokenNumber = getRandomTokenNumber();
      return {
        id: Date.now().toString() + index,
        name: item.name.replace(/\.[^/.]+$/, ""),
        type: "direct",
        imageData: item.data,
        // Already processed PNG at correct dimensions
        tokenNumber
      };
    });
    onUpdateProject((p) => ({
      ...p,
      customTokens: [...p.customTokens, ...newTokens]
    }));
    setUploadQueue([]);
    setIsForgeOpen(false);
    ue.success(
      `${newTokens.length} ASSET${newTokens.length > 1 ? "S" : ""} INJECTED`
    );
  };
  const unitCount = activeTab === "genesis" ? Object.keys(selectedTraits).length === validLayers.length ? 1 : 0 : uploadQueue.length;
  const isValidated = activeTab === "genesis" ? Object.keys(selectedTraits).length === validLayers.length : uploadQueue.length > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 sm:mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl sm:text-2xl font-black mb-2 text-foreground uppercase tracking-tight", children: "THE FORGE" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs sm:text-sm text-muted-foreground font-bold uppercase tracking-tight", children: "CRAFT LEGENDARY 1-OF-1 TOKENS" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: () => setIsForgeOpen(true),
          className: "bg-primary hover:bg-primary/90 text-primary-foreground font-black h-10 sm:h-12 px-4 sm:px-6 text-xs sm:text-sm uppercase tracking-tight transition-all duration-200 shadow-[0_0_20px_rgba(102,102,102,0.3)] hover:shadow-[0_0_30px_rgba(102,102,102,0.5)]",
          size: "lg",
          children: "OPEN LEGENDARY FORGE"
        }
      ),
      project.customTokens.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 sm:mt-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base sm:text-lg font-black mb-4 sm:mb-6 text-foreground uppercase tracking-tight", children: "FORGED TOKENS" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6", children: project.customTokens.map((token) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "bg-card border border-border rounded-lg overflow-hidden group transition-all duration-200 hover:border-primary/50 relative",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "aspect-square bg-background relative", children: [
                token.imageData && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: token.imageData,
                    alt: token.name,
                    className: "w-full h-full object-contain",
                    style: {
                      imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => confirmDeleteToken(token),
                    className: "absolute top-2 right-2 w-8 h-8 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg",
                    title: "Delete forged token",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 sm:p-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs sm:text-sm font-black uppercase tracking-tight text-foreground mb-1", children: token.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold uppercase tracking-tight text-muted-foreground", children: [
                  token.type === "genesis" ? "GENESIS CRAFT" : "DIRECT INJECTION",
                  token.tokenNumber && ` • #${token.tokenNumber}`
                ] })
              ] })
            ]
          },
          token.id
        )) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: deleteConfirmOpen, onOpenChange: setDeleteConfirmOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "bg-[#1a1a1a] border-2 border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-lg font-black uppercase tracking-tight text-foreground", children: "DELETE FORGED TOKEN?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { className: "text-sm text-muted-foreground", children: [
          'This will permanently delete "',
          tokenToDelete == null ? void 0 : tokenToDelete.name,
          '" from your collection. This action cannot be undone.'
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "font-bold uppercase tracking-tight", children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AlertDialogAction,
          {
            onClick: deleteForgedToken,
            className: "bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase tracking-tight",
            children: "Delete"
          }
        )
      ] })
    ] }) }),
    isForgeOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-card border border-border rounded-lg w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1200px] max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200",
        onClick: (e) => e.stopPropagation(),
        onKeyUp: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-tight text-foreground", children: "LEGENDARY FORGE" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setIsForgeOpen(false),
                className: "text-muted-foreground hover:text-foreground transition-colors",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5 sm:w-6 sm:h-6" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setActiveTab("genesis"),
                className: `flex-1 h-10 sm:h-12 font-black uppercase tracking-tight text-xs sm:text-sm transition-all duration-200 rounded-lg ${activeTab === "genesis" ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(102,102,102,0.4)]" : "bg-background text-muted-foreground hover:text-foreground border border-border"}`,
                children: "GENESIS CRAFT"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setActiveTab("direct"),
                className: `flex-1 h-10 sm:h-12 font-black uppercase tracking-tight text-xs sm:text-sm transition-all duration-200 rounded-lg ${activeTab === "direct" ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(102,102,102,0.4)]" : "bg-background text-muted-foreground hover:text-foreground border border-border"}`,
                children: "DIRECT INJECTION"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6", children: activeTab === "genesis" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-square bg-background rounded-lg border border-border shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] overflow-hidden lg:sticky lg:top-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "canvas",
              {
                ref: previewCanvasRef,
                className: "w-full h-full",
                style: {
                  imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                }
              }
            ) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 sm:space-y-6 pb-4", children: validLayers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-black uppercase tracking-tight text-xs sm:text-sm", children: "ADD LAYERS IN WORKSHOP FIRST" }) }) : validLayers.map((layer) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2 sm:mb-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black uppercase tracking-tight text-foreground", children: [
                  layer.name,
                  " STYLES"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2", children: layer.traits.map((trait) => {
                const isSelected = selectedTraits[layer.id] === trait.id;
                return /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setSelectedTraits((prev) => ({
                      ...prev,
                      [layer.id]: trait.id
                    })),
                    className: `aspect-square bg-background rounded-lg border-2 overflow-hidden transition-all duration-200 ${isSelected ? "border-primary shadow-[0_0_15px_rgba(102,102,102,0.5)]" : "border-border hover:border-muted-foreground"}`,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: trait.imageData,
                        alt: trait.name,
                        className: "w-full h-full object-cover",
                        style: {
                          imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                        }
                      }
                    )
                  },
                  trait.id
                );
              }) })
            ] }, layer.id)) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 sm:space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background/50 border border-border rounded-lg p-4 sm:p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  ref: fileInputRef,
                  type: "file",
                  accept: "image/png,image/jpeg,image/jpg,image/gif",
                  multiple: true,
                  onChange: handleFileSelect,
                  className: "hidden",
                  disabled: isProcessing
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: () => {
                    var _a;
                    return (_a = fileInputRef.current) == null ? void 0 : _a.click();
                  },
                  variant: "outline",
                  className: "w-full h-16 sm:h-20 font-black uppercase tracking-tight text-xs sm:text-sm border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all duration-200",
                  disabled: isProcessing,
                  children: isProcessing ? "PROCESSING IMAGES..." : "SELECT IMAGES TO INJECT"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-3 text-center font-bold uppercase tracking-tight", children: [
                "Images will be processed to ",
                project.settings.outputSize,
                "x",
                project.settings.outputSize,
                "px",
                project.pixelArtMode && " with pixel art mode"
              ] })
            ] }),
            uploadQueue.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black uppercase tracking-tight text-foreground mb-3", children: [
                "INJECTION QUEUE (",
                uploadQueue.length,
                ")"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4", children: uploadQueue.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "bg-background border border-border rounded-lg overflow-hidden group relative",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "aspect-square relative", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: item.data,
                          alt: item.name,
                          className: "w-full h-full object-cover",
                          style: {
                            imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                          }
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => removeFromQueue(item.id),
                          className: "absolute top-1 right-1 w-6 h-6 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-tight text-foreground truncate", children: item.name }) })
                  ]
                },
                item.id
              )) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-border bg-background/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-primary animate-pulse" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-black uppercase tracking-tight text-muted-foreground", children: [
                unitCount,
                " UNIT",
                unitCount !== 1 ? "S" : "",
                " READY"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 sm:gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: () => setIsForgeOpen(false),
                  variant: "outline",
                  className: "font-black uppercase tracking-tight text-xs sm:text-sm h-10 sm:h-12 px-4 sm:px-6",
                  children: "CANCEL"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: activeTab === "genesis" ? mintToVault : authorizeInjection,
                  disabled: !isValidated || isProcessing,
                  className: "bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tight text-xs sm:text-sm h-10 sm:h-12 px-4 sm:px-6 shadow-[0_0_20px_rgba(102,102,102,0.3)] hover:shadow-[0_0_30px_rgba(102,102,102,0.5)] transition-all duration-200",
                  children: activeTab === "genesis" ? "MINT TO VAULT" : "AUTHORIZE INJECTION"
                }
              )
            ] })
          ] }) })
        ]
      }
    ) })
  ] });
}
export {
  Builder as default
};
