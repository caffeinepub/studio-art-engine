import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, X, RefreshCw, Search, Filter, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import VaultViewModeToggle from '@/components/VaultViewModeToggle';
import VaultPublishingControls from '@/components/VaultPublishingControls';
import { yieldToUI } from '@/utils/yieldToUI';
import type { Project, GeneratedNFT } from '../App';
import type {
  WorkerInputMessage,
  WorkerOutputMessage,
  GeneratedNFTData,
  LayerData,
  RuleData,
  ForgedTokenData,
} from '../utils/vaultGeneratorProtocol';
import {
  isProgressMessage,
  isBatchResultMessage,
  isCompleteMessage,
  isCancelAckMessage,
  isErrorMessage,
  isCapabilityMessage,
} from '../utils/vaultGeneratorProtocol';

interface VaultProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

type SortOption = 'index' | 'rarity' | 'common';
type ViewMode = 'compact' | 'grid';

interface ActiveFilter {
  layerId: string;
  traitId: string;
  layerName: string;
  traitName: string;
}

interface ImageCache {
  [key: string]: HTMLImageElement;
}

interface LayerTraitGroup {
  layerId: string;
  layerName: string;
  traits: Array<{
    traitId: string;
    traitName: string;
    count: number;
    percentage: number;
  }>;
}

interface RarityInfo {
  score: number;
  rank: number;
  percentile: number;
  tier: string;
}

// ─── NftJob type for internal use ─────────────────────────────────────────────

interface NftJob {
  tokenId: number;
  dna: string;
  selectedTraits: Record<string, string>;
}

// ─── ZIP creator ───────────────────────────────────────────────────────────────

class SimpleZipCreator {
  private files: Array<{ name: string; data: Uint8Array }> = [];

  addFile(path: string, data: string | Uint8Array) {
    const uint8Data = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data;
    this.files.push({ name: path, data: uint8Data });
  }

  async generate(): Promise<Blob> {
    const chunks: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    for (const file of this.files) {
      const fileName = new TextEncoder().encode(file.name);
      const fileData = file.data;

      const localHeader = new Uint8Array(30 + fileName.length);
      const view = new DataView(localHeader.buffer);
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint32(14, this.crc32(fileData), true);
      view.setUint32(18, fileData.length, true);
      view.setUint32(22, fileData.length, true);
      view.setUint16(26, fileName.length, true);
      view.setUint16(28, 0, true);
      localHeader.set(fileName, 30);

      chunks.push(localHeader);
      chunks.push(fileData);

      const centralHeader = new Uint8Array(46 + fileName.length);
      const cdView = new DataView(centralHeader.buffer);
      cdView.setUint32(0, 0x02014b50, true);
      cdView.setUint16(4, 20, true);
      cdView.setUint16(6, 20, true);
      cdView.setUint16(8, 0, true);
      cdView.setUint16(10, 0, true);
      cdView.setUint16(12, 0, true);
      cdView.setUint16(14, 0, true);
      cdView.setUint32(16, this.crc32(fileData), true);
      cdView.setUint32(20, fileData.length, true);
      cdView.setUint32(24, fileData.length, true);
      cdView.setUint16(28, fileName.length, true);
      cdView.setUint16(30, 0, true);
      cdView.setUint16(32, 0, true);
      cdView.setUint16(34, 0, true);
      cdView.setUint16(36, 0, true);
      cdView.setUint32(38, 0, true);
      cdView.setUint32(42, offset, true);
      centralHeader.set(fileName, 46);
      centralDirectory.push(centralHeader);

      offset += localHeader.length + fileData.length;
    }

    const cdSize = centralDirectory.reduce((sum, cd) => sum + cd.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, this.files.length, true);
    endView.setUint16(10, this.files.length, true);
    endView.setUint32(12, cdSize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);

    const allChunks = [...chunks, ...centralDirectory, endRecord];
    const totalLength = allChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let position = 0;
    for (const chunk of allChunks) { result.set(chunk, position); position += chunk.length; }

    return new Blob([result as unknown as BlobPart], { type: 'application/zip' });
  }

  private crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}

function generateDNA(traits: Record<string, string>, layers: { id: string }[]): string {
  return layers.map(layer => traits[layer.id] || '').join('-');
}

// ─── Main-thread fallback compositor ──────────────────────────────────────────

async function compositeImageMainThread(
  traits: Record<string, string>,
  project: Project
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
  if (!ctx) throw new Error('Canvas context not available');

  if (project.pixelArtMode) ctx.imageSmoothingEnabled = false;

  const imagePromises = project.layers.map(async (layer) => {
    const traitId = traits[layer.id];
    if (!traitId) return null;
    const trait = layer.traits.find(t => t.id === traitId);
    if (!trait) return null;
    return { layer, trait };
  });

  const layerData = (await Promise.all(imagePromises)).filter(Boolean) as Array<{ layer: typeof project.layers[0]; trait: typeof project.layers[0]['traits'][0] }>;

  // Draw in reverse order (lower index = lower layer)
  for (let i = layerData.length - 1; i >= 0; i--) {
    const { layer, trait } = layerData[i];
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
        ctx.drawImage(img, 0, 0, 800, 800);
        ctx.restore();
        resolve();
      };
      img.onerror = reject;
      img.src = trait.imageData;
    });
  }

  return canvas.toDataURL('image/png');
}

// ─── Vault component ───────────────────────────────────────────────────────────

export default function Vault({ project, onUpdateProject }: VaultProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<GeneratedNFT | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('index');
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [activeFilters, setActiveFilters] = useState<Map<string, ActiveFilter>>(new Map());
  const [isRegeneratingNFT, setIsRegeneratingNFT] = useState(false);
  const [headlessMode, setHeadlessMode] = useState(false);

  const imageCache = useRef<ImageCache>({});
  const filterDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerSupportsImageCompositing = useRef<boolean>(false);
  const accumulatedNFTs = useRef<GeneratedNFT[]>([]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const traitFrequencyMap = useMemo(() => {
    const frequencyMap: Record<string, Record<string, number>> = {};
    const totalNFTs = project.generatedNFTs.filter(nft => !nft.isForged).length;
    if (totalNFTs === 0) return frequencyMap;

    project.generatedNFTs.forEach(nft => {
      if (nft.isForged) return;
      const attributes = nft.metadata.attributes as any[];
      attributes.forEach(attr => {
        if (attr.trait_type === 'Type' && attr.value === '1-of-1') return;
        const layer = project.layers.find(l => l.name === attr.trait_type);
        const trait = layer?.traits.find(t => t.name === attr.value);
        if (layer && trait) {
          if (!frequencyMap[layer.id]) frequencyMap[layer.id] = {};
          frequencyMap[layer.id][trait.id] = (frequencyMap[layer.id][trait.id] || 0) + 1;
        }
      });
    });

    Object.keys(frequencyMap).forEach(layerId => {
      Object.keys(frequencyMap[layerId]).forEach(traitId => {
        frequencyMap[layerId][traitId] = frequencyMap[layerId][traitId] / totalNFTs;
      });
    });

    return frequencyMap;
  }, [project.generatedNFTs, project.layers]);

  const groupedTraitsByLayer = useMemo(() => {
    const traitCounts: Record<string, number> = {};
    const totalNFTs = project.generatedNFTs.length;

    project.generatedNFTs.forEach(nft => {
      const attributes = nft.metadata.attributes as any[];
      attributes.forEach(attr => {
        if (attr.trait_type === 'Type' && attr.value === '1-of-1') return;
        const layer = project.layers.find(l => l.name === attr.trait_type);
        const trait = layer?.traits.find(t => t.name === attr.value);
        if (layer && trait) {
          const key = `${layer.id}-${trait.id}`;
          traitCounts[key] = (traitCounts[key] || 0) + 1;
        }
      });
    });

    const layerGroups: LayerTraitGroup[] = project.layers.map(layer => {
      const traits = layer.traits.map(trait => {
        const key = `${layer.id}-${trait.id}`;
        const count = traitCounts[key] || 0;
        const percentage = totalNFTs > 0 ? (count / totalNFTs) * 100 : 0;
        return { traitId: trait.id, traitName: trait.name, count, percentage };
      });
      return { layerId: layer.id, layerName: layer.name, traits };
    });

    return layerGroups;
  }, [project.layers, project.generatedNFTs]);

  const rarityScoreCache = useMemo(() => {
    const cache = new Map<string, number>();
    project.generatedNFTs.forEach(nft => {
      if (nft.isForged) { cache.set(nft.dna, 0.0001); return; }
      const attributes = nft.metadata.attributes as any[];
      let rarityProduct = 1;
      let validTraitCount = 0;
      for (const attr of attributes) {
        if (attr.trait_type === 'Type' && attr.value === '1-of-1') continue;
        const layer = project.layers.find(l => l.name === attr.trait_type);
        const trait = layer?.traits.find(t => t.name === attr.value);
        if (layer && trait && traitFrequencyMap[layer.id]?.[trait.id]) {
          rarityProduct *= traitFrequencyMap[layer.id][trait.id];
          validTraitCount++;
        }
      }
      cache.set(nft.dna, validTraitCount === 0 ? 0.5 : rarityProduct);
    });
    return cache;
  }, [project.generatedNFTs, project.layers, traitFrequencyMap]);

  const rarityInfoMap = useMemo(() => {
    const infoMap = new Map<string, RarityInfo>();
    const sortedNFTs = [...project.generatedNFTs].sort((a, b) => {
      return (rarityScoreCache.get(a.dna) || 0.5) - (rarityScoreCache.get(b.dna) || 0.5);
    });
    const totalItems = sortedNFTs.length;
    sortedNFTs.forEach((nft, index) => {
      const rank = index + 1;
      const percentile = totalItems > 0 ? rank / totalItems : 0;
      const score = rarityScoreCache.get(nft.dna) || 0.5;
      let tier = 'Common';
      if (nft.isForged) tier = 'Legendary';
      else if (percentile <= 0.01) tier = 'Epic';
      else if (percentile <= 0.05) tier = 'Ultra Rare';
      else if (percentile <= 0.15) tier = 'Rare';
      else if (percentile <= 0.30) tier = 'Uncommon';
      infoMap.set(nft.dna, { score, rank, percentile, tier });
    });
    return infoMap;
  }, [project.generatedNFTs, rarityScoreCache]);

  const getRarityInfo = useCallback((nft: GeneratedNFT): RarityInfo => {
    return rarityInfoMap.get(nft.dna) || { score: 0.5, rank: 0, percentile: 0, tier: 'Common' };
  }, [rarityInfoMap]);

  const toggleTraitFilter = useCallback((layerId: string, traitId: string, layerName: string, traitName: string) => {
    if (filterDebounceTimer.current) clearTimeout(filterDebounceTimer.current);
    filterDebounceTimer.current = setTimeout(() => {
      setActiveFilters(prev => {
        const newFilters = new Map(prev);
        const key = `${layerId}-${traitId}`;
        if (newFilters.has(key)) {
          newFilters.delete(key);
          toast.success(`Filter removed: ${traitName}`);
        } else {
          newFilters.set(key, { layerId, traitId, layerName, traitName });
          toast.success(`Filtered by ${traitName}`);
        }
        return newFilters;
      });
    }, 150);
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters(new Map());
    setSearchQuery('');
    toast.success('All filters cleared');
  }, []);

  const filteredAndSortedNFTs = useMemo(() => {
    let result = [...project.generatedNFTs];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const queryAsNumber = parseInt(searchQuery, 10);
      result = result.filter(nft => {
        if (!isNaN(queryAsNumber) && nft.id === queryAsNumber) return true;
        if (nft.metadata.name && String(nft.metadata.name).toLowerCase().includes(query)) return true;
        const attributes = nft.metadata.attributes as any[];
        if (!attributes || !Array.isArray(attributes)) return false;
        return attributes.some(attr => {
          if (!attr || !attr.trait_type || !attr.value) return false;
          return attr.trait_type.toLowerCase().includes(query) || attr.value.toLowerCase().includes(query);
        });
      });
    }

    if (activeFilters.size > 0) {
      const filtersByLayer: Record<string, Set<string>> = {};
      activeFilters.forEach(filter => {
        if (!filtersByLayer[filter.layerId]) filtersByLayer[filter.layerId] = new Set();
        filtersByLayer[filter.layerId].add(filter.traitId);
      });

      result = result.filter(nft => {
        if (filtersByLayer['forged']?.has('1-of-1')) {
          if (nft.isForged) return Object.keys(filtersByLayer).length === 1;
          return false;
        }
        const attributes = nft.metadata.attributes as any[];
        if (!attributes || !Array.isArray(attributes)) return false;
        const nftTraitsByLayer: Record<string, Set<string>> = {};
        attributes.forEach(attr => {
          if (!attr || !attr.trait_type || !attr.value) return;
          if (attr.trait_type === 'Type' && attr.value === '1-of-1') return;
          const layer = project.layers.find(l => l.name === attr.trait_type);
          const trait = layer?.traits.find(t => t.name === attr.value);
          if (layer && trait) {
            if (!nftTraitsByLayer[layer.id]) nftTraitsByLayer[layer.id] = new Set();
            nftTraitsByLayer[layer.id].add(trait.id);
          }
        });
        for (const layerId of Object.keys(filtersByLayer)) {
          if (layerId === 'forged') continue;
          const requiredTraits = filtersByLayer[layerId];
          const nftTraits = nftTraitsByLayer[layerId];
          if (!nftTraits) return false;
          let hasMatchInLayer = false;
          for (const traitId of requiredTraits) {
            if (nftTraits.has(traitId)) { hasMatchInLayer = true; break; }
          }
          if (!hasMatchInLayer) return false;
        }
        return true;
      });
    }

    result.sort((a, b) => {
      const infoA = getRarityInfo(a);
      const infoB = getRarityInfo(b);
      switch (sortOption) {
        case 'index': return a.id - b.id;
        case 'rarity': return infoA.rank - infoB.rank;
        case 'common': return infoB.rank - infoA.rank;
        default: return 0;
      }
    });

    return result;
  }, [project.generatedNFTs, project.layers, searchQuery, sortOption, activeFilters, getRarityInfo]);

  const isValidCombinationLocal = useCallback((traits: Record<string, string>): boolean => {
    for (const rule of project.rules) {
      const hasPrimary = traits[rule.primaryTrait.layerId] === rule.primaryTrait.traitId;
      if (!hasPrimary) continue;
      for (const incompatibleTrait of rule.incompatibleTraits) {
        const hasIncompatible = traits[incompatibleTrait.layerId] === incompatibleTrait.traitId;
        if (rule.type === 'exclude' && hasIncompatible) return false;
        if (rule.type === 'force' && !hasIncompatible) return false;
      }
    }
    return true;
  }, [project.rules]);

  const loadImageWithCache = useCallback(async (src: string): Promise<HTMLImageElement> => {
    if (imageCache.current[src]) return imageCache.current[src];
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imageCache.current[src] = img; resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const generateImageFallback = useCallback(async (traits: Record<string, string>): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    if (!ctx) throw new Error('Canvas context not available');

    if (project.pixelArtMode) ctx.imageSmoothingEnabled = false;

    const imagePromises = project.layers.map(async (layer) => {
      const traitId = traits[layer.id];
      if (!traitId) return null;
      const trait = layer.traits.find(t => t.id === traitId);
      if (!trait) return null;
      try {
        const img = await loadImageWithCache(trait.imageData);
        return { layer, img };
      } catch {
        return null;
      }
    });

    const results = (await Promise.all(imagePromises)).filter(Boolean) as Array<{ layer: typeof project.layers[0]; img: HTMLImageElement }>;

    // Draw in reverse order (lower index = lower layer)
    for (let i = results.length - 1; i >= 0; i--) {
      const { layer, img } = results[i];
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
      ctx.drawImage(img, 0, 0, 800, 800);
      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  }, [project.layers, project.pixelArtMode, loadImageWithCache]);

  // Convert worker NFT data to app GeneratedNFT format
  const workerNFTToGeneratedNFT = useCallback((nftData: GeneratedNFTData): GeneratedNFT => {
    return {
      id: nftData.id,
      dna: nftData.dna,
      imageData: nftData.imageData || '',
      metadata: nftData.metadata,
      isForged: nftData.isForged,
      forgedTokenId: nftData.forgedTokenId,
    };
  }, []);

  const startGeneration = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setGeneratedCount(0);
    accumulatedNFTs.current = [];

    const validLayers = project.layers.filter(l => l.traits.length > 0);
    if (validLayers.length === 0) {
      toast.error('No layers with traits found');
      setIsGenerating(false);
      return;
    }

    // Build forged tokens from customTokens
    const forgedTokens: ForgedTokenData[] = project.customTokens
      .filter(t => t.imageData)
      .map(t => ({ id: t.id, imageData: t.imageData! }));

    // Build layer data for worker
    const layerData: LayerData[] = project.layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      traits: layer.traits.map(trait => ({
        id: trait.id,
        name: trait.name,
        weight: trait.weight,
        imageData: trait.imageData,
      })),
      opacity: layer.opacity,
      blendMode: layer.blendMode,
    }));

    const ruleData: RuleData[] = project.rules.map(rule => ({
      type: rule.type,
      primaryTrait: rule.primaryTrait,
      incompatibleTraits: rule.incompatibleTraits,
    }));

    // Try worker-based generation
    try {
      const worker = new Worker(
        new URL('../workers/vaultGenerator.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      const pendingFallbacks: GeneratedNFTData[] = [];

      await new Promise<void>((resolve, reject) => {
        worker.onmessage = async (event: MessageEvent<WorkerOutputMessage>) => {
          const msg = event.data;

          if (isCapabilityMessage(msg)) {
            workerSupportsImageCompositing.current = msg.payload.supportsImageCompositing;
          } else if (isProgressMessage(msg)) {
            setProgress(msg.payload.percentage);
            setGeneratedCount(msg.payload.generatedCount);
          } else if (isBatchResultMessage(msg)) {
            const batchNFTs: GeneratedNFT[] = [];

            for (const nftData of msg.payload.nfts) {
              if (nftData.imageData) {
                batchNFTs.push(workerNFTToGeneratedNFT(nftData));
              } else if (nftData.selectedTraits && !headlessMode) {
                // Queue for fallback compositing
                pendingFallbacks.push(nftData);
              } else {
                batchNFTs.push(workerNFTToGeneratedNFT(nftData));
              }
            }

            if (batchNFTs.length > 0) {
              accumulatedNFTs.current = [...accumulatedNFTs.current, ...batchNFTs];
              onUpdateProject(p => ({
                ...p,
                generatedNFTs: [...accumulatedNFTs.current],
              }));
              await yieldToUI();
            }
          } else if (isCompleteMessage(msg)) {
            resolve();
          } else if (isCancelAckMessage(msg)) {
            resolve();
          } else if (isErrorMessage(msg)) {
            reject(new Error(msg.payload.message));
          }
        };

        worker.onerror = (err) => reject(new Error(err.message || 'Worker error'));

        const startMsg: WorkerInputMessage = {
          type: 'start',
          payload: {
            layers: layerData,
            rules: ruleData,
            forgedTokens,
            collectionSize: project.collectionSize,
            projectName: project.name,
            blockchain: project.blockchain,
            symbol: project.symbol,
            pixelArtMode: project.pixelArtMode,
            batchSize: 10,
            outputFormat: 'png', // worker will auto-detect GIFs
          },
        };
        worker.postMessage(startMsg);
      });

      // Process pending fallbacks
      if (pendingFallbacks.length > 0 && !headlessMode) {
        for (const nftData of pendingFallbacks) {
          try {
            const imageData = await generateImageFallback(nftData.selectedTraits!);
            const nft: GeneratedNFT = {
              ...workerNFTToGeneratedNFT(nftData),
              imageData,
            };
            accumulatedNFTs.current = [...accumulatedNFTs.current, nft];
          } catch {
            accumulatedNFTs.current = [...accumulatedNFTs.current, workerNFTToGeneratedNFT(nftData)];
          }
          await yieldToUI();
        }

        onUpdateProject(p => ({
          ...p,
          generatedNFTs: [...accumulatedNFTs.current],
        }));
      }

      worker.terminate();
      workerRef.current = null;

    } catch (err) {
      // Full fallback to main thread
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      toast.warning('Using main-thread generation (worker unavailable)');

      const usedDNAs = new Set<string>();
      const allTokenNumbers = Array.from({ length: project.collectionSize }, (_, i) => i + 1);
      const shuffled = [...allTokenNumbers].sort(() => Math.random() - 0.5);
      let tokenIndex = 0;
      let generated = 0;
      let attempts = 0;
      const maxAttempts = project.collectionSize * 100;

      while (generated < project.collectionSize && attempts < maxAttempts && tokenIndex < shuffled.length) {
        attempts++;
        const selectedTraits: Record<string, string> = {};
        for (const layer of validLayers) {
          const random = Math.random() * 100;
          let cumulative = 0;
          for (const trait of layer.traits) {
            cumulative += trait.weight;
            if (random <= cumulative) { selectedTraits[layer.id] = trait.id; break; }
          }
        }

        const dna = generateDNA(selectedTraits, project.layers);
        if (usedDNAs.has(dna)) continue;
        if (!isValidCombinationLocal(selectedTraits)) continue;

        usedDNAs.add(dna);
        const tokenNumber = shuffled[tokenIndex++];

        try {
          const imageData = headlessMode ? '' : await generateImageFallback(selectedTraits);
          const attributes = project.layers
            .filter(l => selectedTraits[l.id])
            .map(layer => {
              const trait = layer.traits.find(t => t.id === selectedTraits[layer.id]);
              return { trait_type: layer.name, value: trait?.name || 'Unknown' };
            });

          const nft: GeneratedNFT = {
            id: tokenNumber,
            dna,
            imageData,
            metadata: {
              name: `${project.name} #${tokenNumber}`,
              description: `${project.name} NFT Collection`,
              image: `${tokenNumber}.png`,
              attributes,
            },
            isForged: false,
          };

          accumulatedNFTs.current = [...accumulatedNFTs.current, nft];
          generated++;

          setProgress((generated / project.collectionSize) * 100);
          setGeneratedCount(generated);

          if (generated % 5 === 0) {
            onUpdateProject(p => ({ ...p, generatedNFTs: [...accumulatedNFTs.current] }));
            await yieldToUI();
          }
        } catch {
          // skip
        }
      }

      onUpdateProject(p => ({
        ...p,
        generatedNFTs: [...accumulatedNFTs.current],
        lastGeneratedAt: Date.now(),
      }));
    }

    onUpdateProject(p => ({ ...p, lastGeneratedAt: Date.now() }));
    setIsGenerating(false);
    toast.success(`Generated ${accumulatedNFTs.current.length} NFTs`);
  }, [
    isGenerating, project, headlessMode,
    generateImageFallback, isValidCombinationLocal,
    workerNFTToGeneratedNFT, onUpdateProject,
  ]);

  const cancelGeneration = useCallback(() => {
    if (workerRef.current) {
      const cancelMsg: WorkerInputMessage = { type: 'cancel' };
      workerRef.current.postMessage(cancelMsg);
    }
    setIsGenerating(false);
    toast.info('Generation cancelled');
  }, []);

  const regenerateNFT = useCallback(async (nft: GeneratedNFT) => {
    if (isRegeneratingNFT) return;
    setIsRegeneratingNFT(true);

    try {
      const validLayers = project.layers.filter(l => l.traits.length > 0);
      const selectedTraits: Record<string, string> = {};

      for (const layer of validLayers) {
        const random = Math.random() * 100;
        let cumulative = 0;
        for (const trait of layer.traits) {
          cumulative += trait.weight;
          if (random <= cumulative) { selectedTraits[layer.id] = trait.id; break; }
        }
      }

      const imageData = await generateImageFallback(selectedTraits);
      const dna = generateDNA(selectedTraits, project.layers);
      const attributes = project.layers
        .filter(l => selectedTraits[l.id])
        .map(layer => {
          const trait = layer.traits.find(t => t.id === selectedTraits[layer.id]);
          return { trait_type: layer.name, value: trait?.name || 'Unknown' };
        });

      const updatedNFT: GeneratedNFT = {
        ...nft,
        dna,
        imageData,
        metadata: {
          ...nft.metadata,
          image: `${nft.id}.png`,
          attributes,
        },
      };

      onUpdateProject(p => ({
        ...p,
        generatedNFTs: p.generatedNFTs.map(n => n.id === nft.id ? updatedNFT : n),
      }));

      toast.success(`NFT #${nft.id} regenerated`);
    } catch {
      toast.error('Failed to regenerate NFT');
    } finally {
      setIsRegeneratingNFT(false);
    }
  }, [isRegeneratingNFT, project, generateImageFallback, onUpdateProject]);

  const exportCollection = useCallback(async () => {
    if (project.generatedNFTs.length === 0) {
      toast.error('No NFTs to export');
      return;
    }

    setIsExporting(true);
    toast.info('Preparing export...');

    try {
      const zip = new SimpleZipCreator();

      for (const nft of project.generatedNFTs) {
        if (nft.imageData) {
          // Detect format from data URL
          const isGif = nft.imageData.startsWith('data:image/gif');
          const ext = isGif ? 'gif' : 'png';
          const base64 = nft.imageData.split(',')[1];
          if (base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            zip.addFile(`images/${nft.id}.${ext}`, bytes);
          }
        }

        const metadataStr = JSON.stringify(nft.metadata, null, 2);
        zip.addFile(`metadata/${nft.id}.json`, metadataStr);
      }

      const zipBlob = await zip.generate();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '-')}-collection.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Collection exported successfully');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [project]);

  const clearCollection = useCallback(() => {
    onUpdateProject(p => ({ ...p, generatedNFTs: [], collectionLocked: false, ipfsPublishing: { status: 'not-ready' } }));
    accumulatedNFTs.current = [];
    toast.success('Collection cleared');
  }, [onUpdateProject]);

  const animatedCount = useMemo(() => {
    return project.generatedNFTs.filter(nft => nft.imageData?.startsWith('data:image/gif')).length;
  }, [project.generatedNFTs]);

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Left sidebar - filters */}
      <div className="w-64 flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
          {activeFilters.size > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all ({activeFilters.size})
            </button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3">
            <Accordion type="multiple" className="space-y-1">
              {groupedTraitsByLayer.map(group => (
                <AccordionItem key={group.layerId} value={group.layerId} className="border-none">
                  <AccordionTrigger className="text-xs font-medium py-2 px-2 hover:bg-muted/50 rounded-md hover:no-underline">
                    {group.layerName}
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <div className="space-y-0.5 pl-2">
                      {group.traits.map(trait => {
                        const key = `${group.layerId}-${trait.traitId}`;
                        const isActive = activeFilters.has(key);
                        return (
                          <button
                            key={trait.traitId}
                            onClick={() => toggleTraitFilter(group.layerId, trait.traitId, group.layerName, trait.traitName)}
                            className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                              isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                          >
                            <span className="truncate">{trait.traitName}</span>
                            <span className="text-[10px] ml-1 flex-shrink-0">
                              {trait.percentage.toFixed(0)}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search NFTs..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1">
            {(['index', 'rarity', 'common'] as SortOption[]).map(opt => (
              <button
                key={opt}
                onClick={() => setSortOption(opt)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  sortOption === opt
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {opt === 'index' ? '#' : opt === 'rarity' ? 'Rarest' : 'Common'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Headless mode */}
            <div className="flex items-center gap-1.5">
              <Switch
                id="headless-mode"
                checked={headlessMode}
                onCheckedChange={setHeadlessMode}
                className="scale-75"
              />
              <Label htmlFor="headless-mode" className="text-xs text-muted-foreground cursor-pointer">
                Fast mode
              </Label>
            </div>

            <VaultViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

            {/* Stats */}
            <span className="text-xs text-muted-foreground">
              {filteredAndSortedNFTs.length} / {project.generatedNFTs.length}
              {animatedCount > 0 && (
                <span className="ml-1 text-primary font-medium">· {animatedCount} animated</span>
              )}
            </span>

            {/* Export */}
            {project.generatedNFTs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportCollection}
                disabled={isExporting}
                className="h-8 text-xs"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span className="ml-1.5">Export</span>
              </Button>
            )}

            {/* Clear */}
            {project.generatedNFTs.length > 0 && !isGenerating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCollection}
                className="h-8 text-xs text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}

            {/* Generate / Cancel */}
            {isGenerating ? (
              <Button variant="destructive" size="sm" onClick={cancelGeneration} className="h-8 text-xs">
                Cancel
              </Button>
            ) : (
              <Button size="sm" onClick={startGeneration} className="h-8 text-xs">
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                {project.generatedNFTs.length > 0 ? 'Regenerate' : 'Generate'}
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {isGenerating && (
          <div className="px-4 py-2 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Generating collection...</span>
              <span>{generatedCount} / {project.collectionSize}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Publishing controls */}
        <div className="px-4 py-3 border-b border-border">
          <VaultPublishingControls
            project={project}
            onUpdateProject={onUpdateProject}
          />
        </div>

        {/* NFT Grid */}
        <ScrollArea className="flex-1">
          {project.generatedNFTs.length === 0 && !isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-8">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No NFTs generated yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Click Generate to create your collection. Animated GIF traits will produce animated NFTs.
              </p>
              <Button size="sm" onClick={startGeneration}>
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Generate Collection
              </Button>
            </div>
          ) : (
            <div className={`p-3 ${
              viewMode === 'compact'
                ? 'grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5'
                : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'
            }`}>
              {filteredAndSortedNFTs.map(nft => {
                const rarityInfo = getRarityInfo(nft);
                const isAnimated = nft.imageData?.startsWith('data:image/gif');

                if (viewMode === 'compact') {
                  return (
                    <div
                      key={nft.id}
                      className="vault-nft-card relative aspect-square cursor-pointer group rounded-md overflow-hidden"
                      onClick={() => setSelectedNFT(nft)}
                      title={`#${nft.id} - ${rarityInfo.tier}${isAnimated ? ' (animated)' : ''}`}
                    >
                      {nft.imageData ? (
                        <img
                          src={nft.imageData}
                          alt={`NFT #${nft.id}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-[8px] text-muted-foreground">#{nft.id}</span>
                        </div>
                      )}
                      {isAnimated && (
                        <div className="absolute top-0.5 right-0.5 bg-primary/90 text-primary-foreground text-[7px] font-bold px-0.5 rounded leading-3">
                          GIF
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Card
                    key={nft.id}
                    className="vault-nft-card cursor-pointer group overflow-hidden hover:shadow-md transition-shadow"
                    onClick={() => setSelectedNFT(nft)}
                  >
                    <div className="relative aspect-square">
                      {nft.imageData ? (
                        <img
                          src={nft.imageData}
                          alt={`NFT #${nft.id}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">#{nft.id}</span>
                        </div>
                      )}
                      {isAnimated && (
                        <div className="absolute top-1.5 right-1.5 bg-primary/90 text-primary-foreground text-[9px] font-bold px-1 py-0.5 rounded">
                          GIF
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">#{nft.id}</span>
                        <span className={`text-[10px] font-medium ${
                          rarityInfo.tier === 'Legendary' ? 'text-yellow-500' :
                          rarityInfo.tier === 'Epic' ? 'text-purple-500' :
                          rarityInfo.tier === 'Ultra Rare' ? 'text-blue-500' :
                          rarityInfo.tier === 'Rare' ? 'text-green-500' :
                          rarityInfo.tier === 'Uncommon' ? 'text-teal-500' :
                          'text-muted-foreground'
                        }`}>
                          {rarityInfo.tier}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedNFT(null)}
        >
          <div
            className="bg-card rounded-2xl overflow-hidden shadow-2xl max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-square">
              {selectedNFT.imageData ? (
                <img
                  src={selectedNFT.imageData}
                  alt={`NFT #${selectedNFT.id}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
              {selectedNFT.imageData?.startsWith('data:image/gif') && (
                <div className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse inline-block" />
                  Animated GIF
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">NFT #{selectedNFT.id}</h3>
                  <span className={`text-xs font-medium ${
                    getRarityInfo(selectedNFT).tier === 'Legendary' ? 'text-yellow-500' :
                    getRarityInfo(selectedNFT).tier === 'Epic' ? 'text-purple-500' :
                    'text-muted-foreground'
                  }`}>
                    {getRarityInfo(selectedNFT).tier} · Rank #{getRarityInfo(selectedNFT).rank}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!selectedNFT.isForged && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { regenerateNFT(selectedNFT); setSelectedNFT(null); }}
                      disabled={isRegeneratingNFT}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regen
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setSelectedNFT(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {(selectedNFT.metadata.attributes as any[])?.map((attr: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-0.5">
                    <span className="text-muted-foreground text-xs">{attr.trait_type}</span>
                    <span className="font-medium text-xs">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
