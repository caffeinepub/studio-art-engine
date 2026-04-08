import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CustomToken, Project } from "../App";
import { processForgeImage } from "../utils/forgeImageProcessing";

interface BuilderProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

export default function Builder({ project, onUpdateProject }: BuilderProps) {
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"genesis" | "direct">("genesis");
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string>>(
    {},
  );
  const [uploadQueue, setUploadQueue] = useState<
    Array<{ id: string; name: string; data: string }>
  >([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<CustomToken | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validLayers = project.layers.filter((l) => l.traits.length > 0);

  const getRandomTokenNumber = useCallback(() => {
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

  const renderGenesisPreview = useCallback(async () => {
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

    // Draw layers in reverse order: lower layers first, higher layers last (on top)
    for (let i = validLayers.length - 1; i >= 0; i--) {
      const layer = validLayers[i];
      const traitId = selectedTraits[layer.id];
      if (!traitId) continue;

      const trait = layer.traits.find((t) => t.id === traitId);
      if (!trait) continue;

      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.save();
          ctx.globalAlpha = layer.opacity / 100;
          ctx.globalCompositeOperation =
            layer.blendMode as GlobalCompositeOperation;
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
    project.settings.outputSize,
  ]);

  useEffect(() => {
    if (activeTab === "genesis" && Object.keys(selectedTraits).length > 0) {
      renderGenesisPreview();
    }
  }, [selectedTraits, activeTab, renderGenesisPreview]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);

    try {
      const processedItems: Array<{ id: string; name: string; data: string }> =
        [];

      for (const file of Array.from(files)) {
        // Validate file type
        const validTypes = [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/gif",
        ];
        if (!validTypes.includes(file.type)) {
          toast.error(`UNSUPPORTED FORMAT: ${file.name}`);
          continue;
        }

        // Read the file
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Process the image (resize to square, apply pixel mode)
        const processedDataUrl = await processForgeImage(dataUrl, {
          outputSize: project.settings.outputSize,
          pixelArtMode: project.pixelArtMode,
        });

        processedItems.push({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          data: processedDataUrl,
        });
      }

      setUploadQueue((prev) => [...prev, ...processedItems]);
    } catch (error) {
      toast.error("IMAGE PROCESSING FAILED");
      console.error("Image processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const confirmDeleteToken = (token: CustomToken) => {
    setTokenToDelete(token);
    setDeleteConfirmOpen(true);
  };

  const deleteForgedToken = () => {
    if (!tokenToDelete) return;

    onUpdateProject((p) => ({
      ...p,
      customTokens: p.customTokens.filter((t) => t.id !== tokenToDelete.id),
      generatedNFTs: p.generatedNFTs.filter(
        (nft) => nft.forgedTokenId !== tokenToDelete.id,
      ),
    }));

    toast.success("FORGED TOKEN DELETED");
    setDeleteConfirmOpen(false);
    setTokenToDelete(null);
  };

  const mintToVault = async () => {
    if (Object.keys(selectedTraits).length !== validLayers.length) {
      toast.error("SELECT ALL TRAITS");
      return;
    }

    const canvas = document.createElement("canvas");
    const size = project.settings.outputSize;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("CANVAS ERROR");
      return;
    }

    if (project.pixelArtMode) {
      ctx.imageSmoothingEnabled = false;
    }

    // Draw layers in reverse order: lower layers first, higher layers last (on top)
    for (let i = validLayers.length - 1; i >= 0; i--) {
      const layer = validLayers[i];
      const traitId = selectedTraits[layer.id];
      if (!traitId) continue;

      const trait = layer.traits.find((t) => t.id === traitId);
      if (!trait) continue;

      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.save();
          ctx.globalAlpha = layer.opacity / 100;
          ctx.globalCompositeOperation =
            layer.blendMode as GlobalCompositeOperation;
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

    const newToken: CustomToken = {
      id: Date.now().toString(),
      name: `Genesis #${project.customTokens.length + 1}`,
      type: "genesis",
      traits: Object.entries(selectedTraits).map(([layerId, traitId]) => ({
        layerId,
        traitId,
      })),
      imageData,
      tokenNumber,
    };

    onUpdateProject((p) => ({
      ...p,
      customTokens: [...p.customTokens, newToken],
    }));

    setIsForgeOpen(false);
    setSelectedTraits({});
    toast.success(`MINTED TO VAULT AS #${tokenNumber}`);
  };

  const authorizeInjection = () => {
    if (uploadQueue.length === 0) {
      toast.error("QUEUE IS EMPTY");
      return;
    }

    // All images in uploadQueue are already processed to the correct dimensions
    const newTokens: CustomToken[] = uploadQueue.map((item, index) => {
      const tokenNumber = getRandomTokenNumber();
      return {
        id: Date.now().toString() + index,
        name: item.name.replace(/\.[^/.]+$/, ""),
        type: "direct",
        imageData: item.data, // Already processed PNG at correct dimensions
        tokenNumber,
      };
    });

    onUpdateProject((p) => ({
      ...p,
      customTokens: [...p.customTokens, ...newTokens],
    }));

    setUploadQueue([]);
    setIsForgeOpen(false);
    toast.success(
      `${newTokens.length} ASSET${newTokens.length > 1 ? "S" : ""} INJECTED`,
    );
  };

  const unitCount =
    activeTab === "genesis"
      ? Object.keys(selectedTraits).length === validLayers.length
        ? 1
        : 0
      : uploadQueue.length;

  const isValidated =
    activeTab === "genesis"
      ? Object.keys(selectedTraits).length === validLayers.length
      : uploadQueue.length > 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-black mb-2 text-foreground uppercase tracking-tight">
                THE FORGE
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-bold uppercase tracking-tight">
                CRAFT LEGENDARY 1-OF-1 TOKENS
              </p>
            </div>

            <Button
              onClick={() => setIsForgeOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black h-10 sm:h-12 px-4 sm:px-6 text-xs sm:text-sm uppercase tracking-tight transition-all duration-200 shadow-[0_0_20px_rgba(102,102,102,0.3)] hover:shadow-[0_0_30px_rgba(102,102,102,0.5)]"
              size="lg"
            >
              OPEN LEGENDARY FORGE
            </Button>

            {project.customTokens.length > 0 && (
              <div className="mt-8 sm:mt-12">
                <h3 className="text-base sm:text-lg font-black mb-4 sm:mb-6 text-foreground uppercase tracking-tight">
                  FORGED TOKENS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {project.customTokens.map((token) => (
                    <div
                      key={token.id}
                      className="bg-card border border-border rounded-lg overflow-hidden group transition-all duration-200 hover:border-primary/50 relative"
                    >
                      <div className="aspect-square bg-background relative">
                        {token.imageData && (
                          <img
                            src={token.imageData}
                            alt={token.name}
                            className="w-full h-full object-contain"
                            style={{
                              imageRendering: project.pixelArtMode
                                ? "pixelated"
                                : "auto",
                            }}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => confirmDeleteToken(token)}
                          className="absolute top-2 right-2 w-8 h-8 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                          title="Delete forged token"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3 sm:p-4">
                        <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-foreground mb-1">
                          {token.name}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                          {token.type === "genesis"
                            ? "GENESIS CRAFT"
                            : "DIRECT INJECTION"}
                          {token.tokenNumber && ` • #${token.tokenNumber}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] border-2 border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black uppercase tracking-tight text-foreground">
              DELETE FORGED TOKEN?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              This will permanently delete "{tokenToDelete?.name}" from your
              collection. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase tracking-tight">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteForgedToken}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase tracking-tight"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isForgeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-card border border-border rounded-lg w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1200px] max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-tight text-foreground">
                LEGENDARY FORGE
              </h2>
              <button
                type="button"
                onClick={() => setIsForgeOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("genesis")}
                  className={`flex-1 h-10 sm:h-12 font-black uppercase tracking-tight text-xs sm:text-sm transition-all duration-200 rounded-lg ${
                    activeTab === "genesis"
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(102,102,102,0.4)]"
                      : "bg-background text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  GENESIS CRAFT
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("direct")}
                  className={`flex-1 h-10 sm:h-12 font-black uppercase tracking-tight text-xs sm:text-sm transition-all duration-200 rounded-lg ${
                    activeTab === "direct"
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(102,102,102,0.4)]"
                      : "bg-background text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  DIRECT INJECTION
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
              {activeTab === "genesis" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  {/* Sticky Preview Column */}
                  <div className="flex flex-col">
                    <div className="aspect-square bg-background rounded-lg border border-border shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] overflow-hidden lg:sticky lg:top-4">
                      <canvas
                        ref={previewCanvasRef}
                        className="w-full h-full"
                        style={{
                          imageRendering: project.pixelArtMode
                            ? "pixelated"
                            : "auto",
                        }}
                      />
                    </div>
                  </div>

                  {/* Scrollable Trait Selection Column */}
                  <div className="space-y-4 sm:space-y-6 pb-4">
                    {validLayers.length === 0 ? (
                      <div className="flex items-center justify-center min-h-[400px]">
                        <p className="text-muted-foreground font-black uppercase tracking-tight text-xs sm:text-sm">
                          ADD LAYERS IN WORKSHOP FIRST
                        </p>
                      </div>
                    ) : (
                      validLayers.map((layer) => (
                        <div key={layer.id}>
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <h3 className="text-xs font-black uppercase tracking-tight text-foreground">
                              {layer.name} STYLES
                            </h3>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                            {layer.traits.map((trait) => {
                              const isSelected =
                                selectedTraits[layer.id] === trait.id;
                              return (
                                <button
                                  type="button"
                                  key={trait.id}
                                  onClick={() =>
                                    setSelectedTraits((prev) => ({
                                      ...prev,
                                      [layer.id]: trait.id,
                                    }))
                                  }
                                  className={`aspect-square bg-background rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                                    isSelected
                                      ? "border-primary shadow-[0_0_15px_rgba(102,102,102,0.5)]"
                                      : "border-border hover:border-muted-foreground"
                                  }`}
                                >
                                  <img
                                    src={trait.imageData}
                                    alt={trait.name}
                                    className="w-full h-full object-cover"
                                    style={{
                                      imageRendering: project.pixelArtMode
                                        ? "pixelated"
                                        : "auto",
                                    }}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-background/50 border border-border rounded-lg p-4 sm:p-6">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full h-16 sm:h-20 font-black uppercase tracking-tight text-xs sm:text-sm border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all duration-200"
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? "PROCESSING IMAGES..."
                        : "SELECT IMAGES TO INJECT"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3 text-center font-bold uppercase tracking-tight">
                      Images will be processed to {project.settings.outputSize}x
                      {project.settings.outputSize}px
                      {project.pixelArtMode && " with pixel art mode"}
                    </p>
                  </div>

                  {uploadQueue.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-tight text-foreground mb-3">
                        INJECTION QUEUE ({uploadQueue.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {uploadQueue.map((item) => (
                          <div
                            key={item.id}
                            className="bg-background border border-border rounded-lg overflow-hidden group relative"
                          >
                            <div className="aspect-square relative">
                              <img
                                src={item.data}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                style={{
                                  imageRendering: project.pixelArtMode
                                    ? "pixelated"
                                    : "auto",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeFromQueue(item.id)}
                                className="absolute top-1 right-1 w-6 h-6 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="p-2">
                              <p className="text-xs font-bold uppercase tracking-tight text-foreground truncate">
                                {item.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-border bg-background/50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-tight text-muted-foreground">
                    {unitCount} UNIT{unitCount !== 1 ? "S" : ""} READY
                  </span>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    onClick={() => setIsForgeOpen(false)}
                    variant="outline"
                    className="font-black uppercase tracking-tight text-xs sm:text-sm h-10 sm:h-12 px-4 sm:px-6"
                  >
                    CANCEL
                  </Button>
                  <Button
                    onClick={
                      activeTab === "genesis" ? mintToVault : authorizeInjection
                    }
                    disabled={!isValidated || isProcessing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tight text-xs sm:text-sm h-10 sm:h-12 px-4 sm:px-6 shadow-[0_0_20px_rgba(102,102,102,0.3)] hover:shadow-[0_0_30px_rgba(102,102,102,0.5)] transition-all duration-200"
                  >
                    {activeTab === "genesis"
                      ? "MINT TO VAULT"
                      : "AUTHORIZE INJECTION"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
