import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Sparkles,
  Download,
  Trash2,
  Search,
  Filter,
  Loader2,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import type { Project, GeneratedNFT } from '../App';
import { useConfirmDestructive } from '@/hooks/useConfirmDestructive';
import VaultViewModeToggle from '@/components/VaultViewModeToggle';
import VaultPublishingControls from '@/components/VaultPublishingControls';
import type {
  WorkerInputMessage,
  WorkerOutputMessage,
  GeneratedNFTData,
} from '@/utils/vaultGeneratorProtocol';
import {
  isProgressMessage,
  isBatchResultMessage,
  isCompleteMessage,
  isCancelAckMessage,
  isErrorMessage,
  isCapabilityMessage,
} from '@/utils/vaultGeneratorProtocol';

interface VaultProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

export default function Vault({ project, onUpdateProject }: VaultProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrait, setFilterTrait] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'compact' | 'grid'>('grid');
  const [workerSupportsCompositing, setWorkerSupportsCompositing] = useState(false);

  const { confirm } = useConfirmDestructive();
  const workerRef = useRef<Worker | null>(null);
  const pendingNFTsRef = useRef<GeneratedNFTData[]>([]);

  const isLocked = project.collectionLocked || false;

  // Initialize worker
  useEffect(() => {
    const worker = new Worker(new URL('../workers/vaultGenerator.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent<WorkerOutputMessage>) => {
      const message = event.data;

      if (isCapabilityMessage(message)) {
        setWorkerSupportsCompositing(message.payload.supportsImageCompositing);
      } else if (isProgressMessage(message)) {
        setGenerationProgress(Math.round(message.payload.percentage));
        setGenerationStatus(
          `Generating ${message.payload.generatedCount} of ${message.payload.totalCount}...`
        );
      } else if (isBatchResultMessage(message)) {
        pendingNFTsRef.current.push(...message.payload.nfts);
      } else if (isCompleteMessage(message)) {
        commitPendingNFTs();
        setIsGenerating(false);
        setGenerationProgress(100);
        setGenerationStatus('Generation complete!');
        toast.success(`Generated ${message.payload.totalGenerated} NFTs successfully!`);
      } else if (isCancelAckMessage(message)) {
        commitPendingNFTs();
        setIsGenerating(false);
        setGenerationStatus('Generation cancelled');
        toast.info('Generation cancelled');
      } else if (isErrorMessage(message)) {
        setIsGenerating(false);
        setGenerationStatus('');
        toast.error(message.payload.message);
      }
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
      setIsGenerating(false);
      setGenerationStatus('');
      toast.error('Generation failed');
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  // Commit pending NFTs to project state
  const commitPendingNFTs = () => {
    if (pendingNFTsRef.current.length === 0) return;

    const nftsToCommit = [...pendingNFTsRef.current];
    pendingNFTsRef.current = [];

    onUpdateProject((p) => {
      const existingNFTs = p.generatedNFTs || [];
      const nftsNeedingCompositing: GeneratedNFTData[] = [];

      const newNFTs: GeneratedNFT[] = nftsToCommit.map((nftData) => {
        if (!nftData.imageData && nftData.selectedTraits) {
          nftsNeedingCompositing.push(nftData);
        }

        return {
          id: nftData.id,
          dna: nftData.dna,
          imageData: nftData.imageData || '',
          metadata: nftData.metadata,
          isForged: nftData.isForged,
          forgedTokenId: nftData.forgedTokenId,
        };
      });

      // Fallback compositing for NFTs without images
      if (nftsNeedingCompositing.length > 0 && !workerSupportsCompositing) {
        setTimeout(() => {
          compositeMissingImages(nftsNeedingCompositing);
        }, 100);
      }

      return {
        ...p,
        generatedNFTs: [...existingNFTs, ...newNFTs],
      };
    });
  };

  // Fallback main-thread image compositing
  const compositeMissingImages = (nftsData: GeneratedNFTData[]) => {
    const canvas = document.createElement('canvas');
    const outputSize = project.settings.outputSize || 800;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    if (project.pixelArtMode) {
      ctx.imageSmoothingEnabled = false;
    }

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const compositeOne = async (nftData: GeneratedNFTData) => {
      if (!nftData.selectedTraits) return;

      ctx.clearRect(0, 0, outputSize, outputSize);

      // Draw layers in reverse order: lower layers first, higher layers last (on top)
      for (let i = project.layers.length - 1; i >= 0; i--) {
        const layer = project.layers[i];
        const traitId = nftData.selectedTraits[layer.id];
        if (!traitId) continue;

        const trait = layer.traits.find((t) => t.id === traitId);
        if (!trait) continue;

        try {
          const img = await loadImage(trait.imageData);
          ctx.save();
          ctx.globalAlpha = layer.opacity / 100;
          ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
          ctx.drawImage(img, 0, 0, outputSize, outputSize);
          ctx.restore();
        } catch (error) {
          console.error('Failed to load trait image:', error);
        }
      }

      const imageData = canvas.toDataURL('image/png');

      onUpdateProject((p) => ({
        ...p,
        generatedNFTs: p.generatedNFTs.map((nft) =>
          nft.id === nftData.id ? { ...nft, imageData } : nft
        ),
      }));
    };

    nftsData.forEach((nftData) => {
      compositeOne(nftData);
    });
  };

  // Start generation
  const handleGenerate = () => {
    if (isLocked) {
      toast.error('Collection is locked. Unlock it first to regenerate.');
      return;
    }

    if (!workerRef.current) {
      toast.error('Worker not initialized');
      return;
    }

    if (project.layers.length === 0) {
      toast.error('Add at least one layer with traits first');
      return;
    }

    const validLayers = project.layers.filter((l) => l.traits.length > 0);
    if (validLayers.length === 0) {
      toast.error('Add traits to your layers first');
      return;
    }

    // Clear existing NFTs
    onUpdateProject((p) => ({
      ...p,
      generatedNFTs: [],
    }));

    pendingNFTsRef.current = [];
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Starting generation...');

    const message: WorkerInputMessage = {
      type: 'start',
      payload: {
        layers: project.layers.map((layer) => ({
          id: layer.id,
          name: layer.name,
          traits: layer.traits.map((trait) => ({
            id: trait.id,
            name: trait.name,
            weight: trait.weight,
            imageData: trait.imageData,
          })),
          opacity: layer.opacity,
          blendMode: layer.blendMode,
        })),
        rules: project.rules.map((rule) => ({
          type: rule.type,
          primaryTrait: rule.primaryTrait,
          incompatibleTraits: rule.incompatibleTraits,
        })),
        forgedTokens: project.customTokens
          .filter((token) => token.imageData)
          .map((token) => ({
            id: token.id,
            imageData: token.imageData!,
          })),
        collectionSize: project.collectionSize,
        projectName: project.name,
        blockchain: project.blockchain,
        symbol: project.symbol,
        pixelArtMode: project.pixelArtMode,
        batchSize: 50,
        outputSize: project.settings.outputSize || 800,
      },
    };

    workerRef.current.postMessage(message);
  };

  // Cancel generation
  const handleCancelGeneration = () => {
    if (workerRef.current) {
      const message: WorkerInputMessage = { type: 'cancel' };
      workerRef.current.postMessage(message);
    }
  };

  // Delete all NFTs
  const handleDeleteAll = async () => {
    const confirmed = await confirm({
      title: 'Delete all NFTs?',
      description: 'This will permanently delete all generated NFTs from the vault.',
    });

    if (confirmed) {
      onUpdateProject((p) => ({
        ...p,
        generatedNFTs: [],
      }));
      toast.success('All NFTs deleted');
    }
  };

  // Regenerate single NFT
  const handleRegenerateNFT = async (nftId: number) => {
    if (isLocked) {
      toast.error('Collection is locked. Unlock it first to regenerate.');
      return;
    }

    const nft = project.generatedNFTs.find((n) => n.id === nftId);
    if (!nft) return;

    if (nft.isForged) {
      toast.error('Cannot regenerate forged tokens');
      return;
    }

    const validLayers = project.layers.filter((l) => l.traits.length > 0);
    if (validLayers.length === 0) {
      toast.error('No valid layers to regenerate from');
      return;
    }

    // Simple regeneration logic (main thread)
    const selectedTraits: Record<string, string> = {};
    for (const layer of validLayers) {
      const random = Math.random() * 100;
      let cumulative = 0;
      for (const trait of layer.traits) {
        cumulative += trait.weight;
        if (random <= cumulative) {
          selectedTraits[layer.id] = trait.id;
          break;
        }
      }
    }

    // Composite image
    const canvas = document.createElement('canvas');
    const outputSize = project.settings.outputSize || 800;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    if (project.pixelArtMode) {
      ctx.imageSmoothingEnabled = false;
    }

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      // Draw layers in reverse order: lower layers first, higher layers last (on top)
      for (let i = project.layers.length - 1; i >= 0; i--) {
        const layer = project.layers[i];
        const traitId = selectedTraits[layer.id];
        if (!traitId) continue;

        const trait = layer.traits.find((t) => t.id === traitId);
        if (!trait) continue;

        const img = await loadImage(trait.imageData);
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
        ctx.drawImage(img, 0, 0, outputSize, outputSize);
        ctx.restore();
      }

      const imageData = canvas.toDataURL('image/png');

      const attributes = project.layers
        .filter((l) => selectedTraits[l.id])
        .map((layer) => {
          const trait = layer.traits.find((t) => t.id === selectedTraits[layer.id]);
          return {
            trait_type: layer.name,
            value: trait?.name || 'Unknown',
          };
        });

      onUpdateProject((p) => ({
        ...p,
        generatedNFTs: p.generatedNFTs.map((n) =>
          n.id === nftId
            ? {
                ...n,
                imageData,
                metadata: {
                  ...n.metadata,
                  attributes,
                },
              }
            : n
        ),
      }));

      toast.success('NFT regenerated');
    } catch (error) {
      toast.error('Failed to regenerate NFT');
    }
  };

  // Export collection as ZIP
  const handleExportCollection = async () => {
    if (project.generatedNFTs.length === 0) {
      toast.error('No NFTs to export');
      return;
    }

    toast.info('Preparing export... This may take a moment for large collections.');

    try {
      // Create a simple ZIP-like structure using Blob and download
      // Since we can't use external libraries, we'll create individual downloads
      // or use a data URL approach for smaller collections
      
      // For now, let's create a simple JSON export with base64 images
      const exportData = {
        project: {
          name: project.name,
          symbol: project.symbol,
          blockchain: project.blockchain,
          collectionSize: project.collectionSize,
        },
        nfts: project.generatedNFTs.map((nft, index) => {
          const tokenId = index + 1;
          return {
            tokenId,
            filename: `${tokenId}.png`,
            imageData: nft.imageData,
            metadata: {
              ...nft.metadata,
              image: `${tokenId}.png`,
            },
          };
        }),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '_')}_collection_export.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Collection exported as JSON. Extract images and metadata from the file.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export collection');
    }
  };

  // Filter and search NFTs
  const filteredNFTs = useMemo(() => {
    let filtered = project.generatedNFTs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((nft) => {
        const metadata = nft.metadata as any;
        const name = metadata?.name;
        const attributes = metadata?.attributes;
        
        return (
          nft.id.toString().includes(query) ||
          (typeof name === 'string' && name.toLowerCase().includes(query)) ||
          (Array.isArray(attributes) && attributes.some((attr: any) =>
            typeof attr?.value === 'string' && attr.value.toLowerCase().includes(query)
          ))
        );
      });
    }

    if (filterTrait !== 'all') {
      filtered = filtered.filter((nft) => {
        const metadata = nft.metadata as any;
        const attributes = metadata?.attributes;
        return Array.isArray(attributes) && attributes.some((attr: any) => attr?.value === filterTrait);
      });
    }

    return filtered;
  }, [project.generatedNFTs, searchQuery, filterTrait]);

  // Get all unique trait values for filter
  const allTraitValues = useMemo(() => {
    const values = new Set<string>();
    project.generatedNFTs.forEach((nft) => {
      const metadata = nft.metadata as any;
      const attributes = metadata?.attributes;
      if (Array.isArray(attributes)) {
        attributes.forEach((attr: any) => {
          if (attr?.value && typeof attr.value === 'string') {
            values.add(attr.value);
          }
        });
      }
    });
    return Array.from(values).sort();
  }, [project.generatedNFTs]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vault</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate and manage your NFT collection
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {project.generatedNFTs.length} / {project.collectionSize} NFTs
          </Badge>
        </div>

        <Separator />

        {/* Publishing Controls - Always Visible */}
        <VaultPublishingControls project={project} onUpdateProject={onUpdateProject} />

        <Separator />

        {/* Generation Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isLocked}
            size="default"
            className="focus-ring"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>

          {isGenerating && (
            <Button onClick={handleCancelGeneration} variant="outline" size="default">
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}

          <Button
            onClick={handleExportCollection}
            disabled={project.generatedNFTs.length === 0}
            variant="outline"
            size="default"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>

          <Button
            onClick={handleDeleteAll}
            disabled={project.generatedNFTs.length === 0 || isLocked}
            variant="outline"
            size="default"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All
          </Button>

          <div className="flex-1" />

          <VaultViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{generationStatus}</span>
              <span className="text-muted-foreground">{generationProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Search and Filter */}
        {project.generatedNFTs.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, name, or trait..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Select value={filterTrait} onValueChange={setFilterTrait}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by trait" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All traits</SelectItem>
                  {allTraitValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* NFT Grid */}
        {filteredNFTs.length > 0 ? (
          <ScrollArea className="h-[600px] rounded-lg border">
            <div
              className={
                viewMode === 'compact'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4'
                  : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4'
              }
            >
              {filteredNFTs.map((nft) => {
                const metadata = nft.metadata as any;
                const name = metadata?.name;
                const attributes = metadata?.attributes;
                
                return (
                  <div
                    key={nft.id}
                    className="vault-nft-card group relative rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="aspect-square relative">
                      <img
                        src={nft.imageData}
                        alt={typeof name === 'string' ? name : `NFT #${nft.id}`}
                        className="w-full h-full object-cover"
                      />
                      {nft.isForged && (
                        <Badge className="absolute top-2 left-2 text-xs">1-of-1</Badge>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">#{nft.id}</span>
                        {!nft.isForged && !isLocked && (
                          <Button
                            onClick={() => handleRegenerateNFT(nft.id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      {viewMode === 'grid' && Array.isArray(attributes) && (
                        <div className="space-y-1">
                          {attributes.slice(0, 3).map((attr: any, i: number) => (
                            <div key={i} className="text-xs text-muted-foreground">
                              <span className="font-medium">{attr?.trait_type}:</span> {attr?.value}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : project.generatedNFTs.length > 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No NFTs match your search or filter</p>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No NFTs generated yet. Click Generate to start!</p>
          </div>
        )}
      </div>
    </div>
  );
}
