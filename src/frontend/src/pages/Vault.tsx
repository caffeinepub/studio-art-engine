import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Download, X, RefreshCw, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { Project, GeneratedNFT } from '../App';
import { buildMetadataForNFT } from '../utils/metadataPresets';
import VaultViewModeToggle from '../components/VaultViewModeToggle';
import VaultPublishingControls from '../components/VaultPublishingControls';

interface VaultProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

export default function Vault({ project, onUpdateProject }: VaultProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTraitFilters, setSelectedTraitFilters] = useState<Record<string, string[]>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const workerRef = useRef<Worker | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isLocked = project.collectionLocked || false;

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/vaultGenerator.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current.onmessage = (e: MessageEvent) => {
      const message = e.data;

      if (message.type === 'progress') {
        setGenerationProgress(message.progress);
        setGenerationStage(message.stage);
      } else if (message.type === 'batch') {
        onUpdateProject((p) => ({
          ...p,
          generatedNFTs: [...p.generatedNFTs, ...message.nfts],
        }));
      } else if (message.type === 'complete') {
        setIsGenerating(false);
        setGenerationProgress(100);
        setGenerationStage('Complete');
        toast.success(`Generated ${message.totalGenerated} unique NFTs!`);
      } else if (message.type === 'error') {
        setIsGenerating(false);
        toast.error(message.error);
      } else if (message.type === 'cancelled') {
        setIsGenerating(false);
        setGenerationProgress(0);
        setGenerationStage('');
        toast.info('Generation cancelled');
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [onUpdateProject]);

  const handleGenerate = useCallback(() => {
    // Check if collection is locked
    if (isLocked) {
      toast.error('Collection is locked', {
        description: 'Unlock the collection before generating.',
      });
      return;
    }

    // Validation
    if (project.layers.length === 0) {
      toast.error('Add at least one layer to generate NFTs');
      return;
    }

    const hasTraits = project.layers.some((layer) => layer.traits.length > 0);
    if (!hasTraits) {
      toast.error('Add at least one trait to a layer');
      return;
    }

    // Clear existing NFTs
    onUpdateProject((p) => ({
      ...p,
      generatedNFTs: [],
    }));

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStage('Initializing...');

    abortControllerRef.current = new AbortController();

    const startMessage = {
      type: 'start',
      collectionSize: project.collectionSize,
      layers: project.layers,
      rules: project.rules,
      forgedTokens: [],
      canvasWidth: project.settings.outputSize,
      canvasHeight: project.settings.outputSize,
      pixelArtMode: project.pixelArtMode,
    };

    workerRef.current?.postMessage(startMessage);
  }, [project, onUpdateProject, isLocked]);

  const handleCancelGeneration = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'cancel' });
    }
    abortControllerRef.current?.abort();
  }, []);

  const handleRegenerateAll = useCallback(() => {
    // Check if collection is locked
    if (isLocked) {
      toast.error('Collection is locked', {
        description: 'Unlock the collection before regenerating.',
      });
      return;
    }

    handleGenerate();
  }, [handleGenerate, isLocked]);

  const handleDeleteNFT = useCallback(
    (nftId: number) => {
      onUpdateProject((p) => ({
        ...p,
        generatedNFTs: p.generatedNFTs.filter((nft) => nft.id !== nftId),
      }));
      toast.success('NFT deleted');
    },
    [onUpdateProject]
  );

  const handleExportAll = useCallback(() => {
    if (project.generatedNFTs.length === 0) {
      toast.error('No NFTs to export');
      return;
    }

    try {
      // Export images
      project.generatedNFTs.forEach((nft) => {
        const link = document.createElement('a');
        link.href = nft.imageData;
        const actualTokenId = project.settings.startTokenNumberAtZero ? nft.id - 1 : nft.id;
        link.download = `${actualTokenId}.png`;
        link.click();
      });

      // Export metadata
      const metadataArray = project.generatedNFTs.map((nft) => {
        const attributes = Array.isArray(nft.metadata.attributes) 
          ? nft.metadata.attributes as Array<{ trait_type: string; value: string }>
          : [];
        return buildMetadataForNFT(
          project.name,
          project.symbol,
          project.settings,
          nft.id,
          attributes
        );
      });

      const metadataBlob = new Blob([JSON.stringify(metadataArray, null, 2)], {
        type: 'application/json',
      });
      const metadataUrl = URL.createObjectURL(metadataBlob);
      const metadataLink = document.createElement('a');
      metadataLink.href = metadataUrl;
      metadataLink.download = `${project.name.replace(/\s+/g, '_')}_metadata.json`;
      metadataLink.click();
      URL.revokeObjectURL(metadataUrl);

      toast.success('Export complete!');
    } catch (error) {
      toast.error('Export failed');
    }
  }, [project]);

  // Filter NFTs
  const filteredNFTs = useMemo(() => {
    let filtered = project.generatedNFTs;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((nft) => {
        const idMatch = nft.id.toString().includes(query);
        const attributes = Array.isArray(nft.metadata.attributes) 
          ? nft.metadata.attributes as Array<{ trait_type: string; value: string }>
          : [];
        const attributeMatch = attributes.some(
          (attr) =>
            attr.trait_type.toLowerCase().includes(query) || attr.value.toLowerCase().includes(query)
        );
        return idMatch || attributeMatch;
      });
    }

    // Trait filters
    const activeFilters = Object.entries(selectedTraitFilters).filter(([_, values]) => values.length > 0);
    if (activeFilters.length > 0) {
      filtered = filtered.filter((nft) => {
        const attributes = Array.isArray(nft.metadata.attributes) 
          ? nft.metadata.attributes as Array<{ trait_type: string; value: string }>
          : [];
        return activeFilters.every(([layerName, traitValues]) => {
          const attr = attributes.find((a) => a.trait_type === layerName);
          return attr && traitValues.includes(attr.value);
        });
      });
    }

    return filtered;
  }, [project.generatedNFTs, searchQuery, selectedTraitFilters]);

  // Build trait filter options
  const traitFilterOptions = useMemo(() => {
    const options: Record<string, Set<string>> = {};

    project.generatedNFTs.forEach((nft) => {
      const attributes = Array.isArray(nft.metadata.attributes) 
        ? nft.metadata.attributes as Array<{ trait_type: string; value: string }>
        : [];
      attributes.forEach((attr) => {
        if (!options[attr.trait_type]) {
          options[attr.trait_type] = new Set();
        }
        options[attr.trait_type].add(attr.value);
      });
    });

    return Object.fromEntries(Object.entries(options).map(([key, set]) => [key, Array.from(set).sort()]));
  }, [project.generatedNFTs]);

  const toggleTraitFilter = useCallback((layerName: string, traitValue: string) => {
    setSelectedTraitFilters((prev) => {
      const current = prev[layerName] || [];
      const updated = current.includes(traitValue)
        ? current.filter((v) => v !== traitValue)
        : [...current, traitValue];

      if (updated.length === 0) {
        const { [layerName]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [layerName]: updated };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedTraitFilters({});
    setSearchQuery('');
  }, []);

  const hasActiveFilters = searchQuery.trim() !== '' || Object.keys(selectedTraitFilters).length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 page-transition">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vault</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate and manage your NFT collection
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isLocked}
              size="lg"
              className="font-semibold focus-ring"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </div>

        {/* Publishing Controls */}
        <VaultPublishingControls project={project} onUpdateProject={onUpdateProject} />

        {/* Generation Progress */}
        {isGenerating && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{generationStage}</span>
                  <span className="text-muted-foreground">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <Button onClick={handleCancelGeneration} variant="outline" size="sm" className="w-full">
                  Cancel Generation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collection Stats & Actions */}
        {project.generatedNFTs.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{filteredNFTs.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {filteredNFTs.length === project.generatedNFTs.length
                      ? 'Total NFTs'
                      : `of ${project.generatedNFTs.length} NFTs`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <VaultViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                  <Button
                    onClick={handleRegenerateAll}
                    variant="outline"
                    size="sm"
                    disabled={isGenerating || isLocked}
                    className="focus-ring"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate All
                  </Button>
                  <Button onClick={handleExportAll} variant="outline" size="sm" className="focus-ring">
                    <Download className="w-4 h-4 mr-2" />
                    Export All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {project.generatedNFTs.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID or traits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 focus-ring"
                  />
                </div>

                {/* Trait Filters */}
                {Object.keys(traitFilterOptions).length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="filters" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-2">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          <span className="font-medium">Trait Filters</span>
                          {Object.keys(selectedTraitFilters).length > 0 && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              {Object.values(selectedTraitFilters).flat().length}
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {Object.entries(traitFilterOptions).map(([layerName, traitValues]) => (
                            <div key={layerName} className="space-y-2">
                              <Label className="text-sm font-medium">{layerName}</Label>
                              <div className="flex flex-wrap gap-2">
                                {traitValues.map((traitValue) => {
                                  const isSelected = selectedTraitFilters[layerName]?.includes(traitValue);
                                  return (
                                    <button
                                      key={traitValue}
                                      onClick={() => toggleTraitFilter(layerName, traitValue)}
                                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors focus-ring ${
                                        isSelected
                                          ? 'bg-primary text-primary-foreground border-primary'
                                          : 'bg-background hover:bg-muted border-border'
                                      }`}
                                    >
                                      {traitValue}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          {hasActiveFilters && (
                            <Button
                              onClick={clearAllFilters}
                              variant="outline"
                              size="sm"
                              className="w-full focus-ring"
                            >
                              Clear All Filters
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NFT Grid */}
        {filteredNFTs.length > 0 ? (
          <div
            className={
              viewMode === 'compact'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3'
                : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            }
          >
            {filteredNFTs.map((nft) => (
              <Card
                key={nft.id}
                className="vault-nft-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative group">
                  <img
                    src={nft.imageData}
                    alt={`NFT #${nft.id}`}
                    className={`w-full ${
                      project.pixelArtMode ? 'image-rendering-pixelated' : ''
                    } ${viewMode === 'compact' ? 'aspect-square' : ''} object-cover`}
                    style={
                      project.pixelArtMode
                        ? { imageRendering: 'pixelated' }
                        : {}
                    }
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => handleDeleteNFT(nft.id)}
                      variant="destructive"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label="Delete NFT"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {viewMode === 'grid' && (
                  <CardContent className="p-3 space-y-2">
                    <p className="font-semibold text-sm">
                      #{project.settings.startTokenNumberAtZero ? nft.id - 1 : nft.id}
                    </p>
                    <div className="space-y-1">
                      {Array.isArray(nft.metadata.attributes) && 
                        (nft.metadata.attributes as Array<{ trait_type: string; value: string }>)
                          .slice(0, 3)
                          .map((attr, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-muted-foreground truncate">{attr.trait_type}:</span>
                              <span className="font-medium truncate ml-2">{attr.value}</span>
                            </div>
                          ))}
                      {Array.isArray(nft.metadata.attributes) && nft.metadata.attributes.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{nft.metadata.attributes.length - 3} more
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : project.generatedNFTs.length > 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No NFTs match your filters</p>
              <Button onClick={clearAllFilters} variant="outline" size="sm" className="mt-4 focus-ring">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {isLocked
                  ? 'Collection is locked. Unlock to generate NFTs.'
                  : 'Click Generate to create your NFT collection'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
