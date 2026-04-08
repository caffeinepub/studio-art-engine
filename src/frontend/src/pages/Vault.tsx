import MotionIconButton from "@/components/MotionIconButton";
import VaultPublishingControls from "@/components/VaultPublishingControls";
import VaultViewModeToggle from "@/components/VaultViewModeToggle";
import {
  DownloadIcon,
  FilterIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from "@/components/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { yieldToUI } from "@/utils/yieldToUI";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { GeneratedNFT, Project } from "../App";
import type {
  ForgedTokenData,
  GeneratedNFTData,
  LayerData,
  RuleData,
  TraitData,
  WorkerInputMessage,
  WorkerOutputMessage,
} from "../utils/vaultGeneratorProtocol";
import {
  isBatchResultMessage,
  isCancelAckMessage,
  isCapabilityMessage,
  isCompleteMessage,
  isErrorMessage,
  isProgressMessage,
} from "../utils/vaultGeneratorProtocol";

interface VaultProps {
  project: Project;
  onUpdateProject: (updater: (project: Project) => Project) => void;
}

type SortOption = "index" | "rarity" | "common";
type ViewMode = "compact" | "grid";

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

class SimpleZipCreator {
  private files: Array<{ name: string; data: Uint8Array }> = [];

  addFile(path: string, data: string | Uint8Array) {
    const uint8Data =
      typeof data === "string" ? new TextEncoder().encode(data) : data;
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
    for (const chunk of allChunks) {
      result.set(chunk, position);
      position += chunk.length;
    }

    return new Blob([result], { type: "application/zip" });
  }

  private crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
}

function generateDNA(
  traits: Record<string, string>,
  layers: { id: string }[],
): string {
  return layers.map((layer) => traits[layer.id] || "").join("-");
}

export default function Vault({ project, onUpdateProject }: VaultProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<GeneratedNFT | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("index");
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [activeFilters, setActiveFilters] = useState<Map<string, ActiveFilter>>(
    new Map(),
  );
  const [isRegeneratingNFT, setIsRegeneratingNFT] = useState(false);
  const [headlessMode, setHeadlessMode] = useState(false);

  const imageCache = useRef<ImageCache>({});
  const filterDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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
    const totalNFTs = project.generatedNFTs.filter(
      (nft) => !nft.isForged,
    ).length;

    if (totalNFTs === 0) return frequencyMap;

    for (const nft of project.generatedNFTs) {
      if (nft.isForged) continue;

      const attributes = nft.metadata.attributes as any[];
      for (const attr of attributes) {
        if (attr.trait_type === "Type" && attr.value === "1-of-1") continue;

        const layer = project.layers.find((l) => l.name === attr.trait_type);
        const trait = layer?.traits.find((t) => t.name === attr.value);

        if (layer && trait) {
          if (!frequencyMap[layer.id]) {
            frequencyMap[layer.id] = {};
          }
          frequencyMap[layer.id][trait.id] =
            (frequencyMap[layer.id][trait.id] || 0) + 1;
        }
      }
    }

    for (const layerId of Object.keys(frequencyMap)) {
      for (const traitId of Object.keys(frequencyMap[layerId])) {
        frequencyMap[layerId][traitId] =
          frequencyMap[layerId][traitId] / totalNFTs;
      }
    }

    return frequencyMap;
  }, [project.generatedNFTs, project.layers]);

  const groupedTraitsByLayer = useMemo(() => {
    const traitCounts: Record<string, number> = {};
    const totalNFTs = project.generatedNFTs.length;

    for (const nft of project.generatedNFTs) {
      const attributes = nft.metadata.attributes as any[];
      for (const attr of attributes) {
        if (attr.trait_type === "Type" && attr.value === "1-of-1") continue;

        const layer = project.layers.find((l) => l.name === attr.trait_type);
        const trait = layer?.traits.find((t) => t.name === attr.value);

        if (layer && trait) {
          const key = `${layer.id}-${trait.id}`;
          traitCounts[key] = (traitCounts[key] || 0) + 1;
        }
      }
    }

    const layerGroups: LayerTraitGroup[] = project.layers.map((layer) => {
      const traits = layer.traits.map((trait) => {
        const key = `${layer.id}-${trait.id}`;
        const count = traitCounts[key] || 0;
        const percentage = totalNFTs > 0 ? (count / totalNFTs) * 100 : 0;

        return {
          traitId: trait.id,
          traitName: trait.name,
          count,
          percentage,
        };
      });

      return {
        layerId: layer.id,
        layerName: layer.name,
        traits,
      };
    });

    return layerGroups;
  }, [project.layers, project.generatedNFTs]);

  const rarityScoreCache = useMemo(() => {
    const cache = new Map<string, number>();

    for (const nft of project.generatedNFTs) {
      if (nft.isForged) {
        cache.set(nft.dna, 0.0001);
        continue;
      }

      const attributes = nft.metadata.attributes as any[];
      let rarityProduct = 1;
      let validTraitCount = 0;

      for (const attr of attributes) {
        if (attr.trait_type === "Type" && attr.value === "1-of-1") continue;

        const layer = project.layers.find((l) => l.name === attr.trait_type);
        const trait = layer?.traits.find((t) => t.name === attr.value);

        if (layer && trait && traitFrequencyMap[layer.id]?.[trait.id]) {
          const frequency = traitFrequencyMap[layer.id][trait.id];
          rarityProduct *= frequency;
          validTraitCount++;
        }
      }

      if (validTraitCount === 0) {
        cache.set(nft.dna, 0.5);
      } else {
        cache.set(nft.dna, rarityProduct);
      }
    }

    return cache;
  }, [project.generatedNFTs, project.layers, traitFrequencyMap]);

  const rarityInfoMap = useMemo(() => {
    const infoMap = new Map<string, RarityInfo>();

    const sortedNFTs = [...project.generatedNFTs].sort((a, b) => {
      const scoreA = rarityScoreCache.get(a.dna) || 0.5;
      const scoreB = rarityScoreCache.get(b.dna) || 0.5;
      return scoreA - scoreB;
    });

    const totalItems = sortedNFTs.length;

    sortedNFTs.forEach((nft, index) => {
      const rank = index + 1;
      const percentile = totalItems > 0 ? rank / totalItems : 0;
      const score = rarityScoreCache.get(nft.dna) || 0.5;

      let tier = "Common";
      if (nft.isForged) {
        tier = "Legendary";
      } else if (percentile <= 0.01) {
        tier = "Epic";
      } else if (percentile <= 0.05) {
        tier = "Ultra Rare";
      } else if (percentile <= 0.15) {
        tier = "Rare";
      } else if (percentile <= 0.3) {
        tier = "Uncommon";
      }

      infoMap.set(nft.dna, {
        score,
        rank,
        percentile,
        tier,
      });
    });

    return infoMap;
  }, [project.generatedNFTs, rarityScoreCache]);

  const getRarityInfo = useCallback(
    (nft: GeneratedNFT): RarityInfo => {
      return (
        rarityInfoMap.get(nft.dna) || {
          score: 0.5,
          rank: 0,
          percentile: 0,
          tier: "Common",
        }
      );
    },
    [rarityInfoMap],
  );

  const toggleTraitFilter = useCallback(
    (
      layerId: string,
      traitId: string,
      layerName: string,
      traitName: string,
    ) => {
      if (filterDebounceTimer.current) {
        clearTimeout(filterDebounceTimer.current);
      }

      filterDebounceTimer.current = setTimeout(() => {
        setActiveFilters((prev) => {
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
    },
    [],
  );

  const clearAllFilters = useCallback(() => {
    setActiveFilters(new Map());
    setSearchQuery("");
    toast.success("All filters cleared");
  }, []);

  const filteredAndSortedNFTs = useMemo(() => {
    let result = [...project.generatedNFTs];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const queryAsNumber = Number.parseInt(searchQuery, 10);

      result = result.filter((nft) => {
        if (!Number.isNaN(queryAsNumber) && nft.id === queryAsNumber)
          return true;
        if (
          nft.metadata.name &&
          String(nft.metadata.name).toLowerCase().includes(query)
        )
          return true;

        const attributes = nft.metadata.attributes as any[];
        if (!attributes || !Array.isArray(attributes)) return false;

        return attributes.some((attr) => {
          if (!attr || !attr.trait_type || !attr.value) return false;
          return (
            attr.trait_type.toLowerCase().includes(query) ||
            attr.value.toLowerCase().includes(query)
          );
        });
      });
    }

    if (activeFilters.size > 0) {
      const filtersByLayer: Record<string, Set<string>> = {};

      for (const filter of activeFilters.values()) {
        if (!filtersByLayer[filter.layerId]) {
          filtersByLayer[filter.layerId] = new Set();
        }
        filtersByLayer[filter.layerId].add(filter.traitId);
      }

      result = result.filter((nft) => {
        if (filtersByLayer.forged?.has("1-of-1")) {
          if (nft.isForged) {
            if (Object.keys(filtersByLayer).length === 1) {
              return true;
            }
            return false;
          }
        }

        const attributes = nft.metadata.attributes as any[];
        if (!attributes || !Array.isArray(attributes)) return false;

        const nftTraitsByLayer: Record<string, Set<string>> = {};
        for (const attr of attributes) {
          if (!attr || !attr.trait_type || !attr.value) continue;
          if (attr.trait_type === "Type" && attr.value === "1-of-1") continue;

          const layer = project.layers.find((l) => l.name === attr.trait_type);
          const trait = layer?.traits.find((t) => t.name === attr.value);
          if (layer && trait) {
            if (!nftTraitsByLayer[layer.id]) {
              nftTraitsByLayer[layer.id] = new Set();
            }
            nftTraitsByLayer[layer.id].add(trait.id);
          }
        }

        for (const layerId of Object.keys(filtersByLayer)) {
          if (layerId === "forged") continue;

          const requiredTraits = filtersByLayer[layerId];
          const nftTraits = nftTraitsByLayer[layerId];

          if (!nftTraits) {
            return false;
          }

          let hasMatchInLayer = false;
          for (const traitId of requiredTraits) {
            if (nftTraits.has(traitId)) {
              hasMatchInLayer = true;
              break;
            }
          }

          if (!hasMatchInLayer) {
            return false;
          }
        }

        return true;
      });
    }

    result.sort((a, b) => {
      const infoA = getRarityInfo(a);
      const infoB = getRarityInfo(b);

      switch (sortOption) {
        case "index":
          return a.id - b.id;
        case "rarity":
          return infoA.rank - infoB.rank;
        case "common":
          return infoB.rank - infoA.rank;
        default:
          return 0;
      }
    });

    return result;
  }, [
    project.generatedNFTs,
    project.layers,
    searchQuery,
    sortOption,
    activeFilters,
    getRarityInfo,
  ]);

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

  const loadImageWithCache = useCallback(
    async (src: string): Promise<HTMLImageElement> => {
      if (imageCache.current[src]) {
        return imageCache.current[src];
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          imageCache.current[src] = img;
          resolve(img);
        };
        img.onerror = reject;
        img.src = src;
      });
    },
    [],
  );

  const generateImage = useCallback(
    async (traits: Record<string, string>): Promise<string> => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
      });
      if (!ctx) throw new Error("Canvas context not available");

      if (project.pixelArtMode) {
        ctx.imageSmoothingEnabled = false;
      }

      const imagePromises = project.layers.map(async (layer) => {
        const traitId = traits[layer.id];
        if (!traitId) return null;

        const trait = layer.traits.find((t) => t.id === traitId);
        if (!trait) return null;

        const img = await loadImageWithCache(trait.imageData);
        return { img, layer };
      });

      const loadedImages = await Promise.all(imagePromises);

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

      const dataURL = canvas.toDataURL("image/png");

      canvas.width = 0;
      canvas.height = 0;

      return dataURL;
    },
    [project.layers, project.pixelArtMode, loadImageWithCache],
  );

  const regenerateSingleNFT = async (nft: GeneratedNFT) => {
    if (nft.isForged) {
      toast.error("Cannot regenerate forged token");
      return;
    }

    setIsRegeneratingNFT(true);

    const validLayers = project.layers.filter((l) => l.traits.length > 0);
    if (validLayers.length === 0) {
      toast.error("Add layers first");
      setIsRegeneratingNFT(false);
      return;
    }

    const usedDNAs = new Set<string>(
      project.generatedNFTs.filter((n) => n.id !== nft.id).map((n) => n.dna),
    );

    let attempts = 0;
    const maxAttempts = 100;
    let newNFT: GeneratedNFT | null = null;

    while (attempts < maxAttempts && !newNFT) {
      attempts++;

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

      const dna = generateDNA(selectedTraits, project.layers);
      if (usedDNAs.has(dna)) continue;
      if (!isValidCombination(selectedTraits)) continue;

      try {
        const imageData = await generateImage(selectedTraits);
        const metadata = createMetadata(nft.id, selectedTraits);

        newNFT = {
          id: nft.id,
          dna,
          imageData,
          metadata,
          isForged: false,
        };
      } catch (error) {
        console.error("Error regenerating NFT:", error);
      }
    }

    if (newNFT) {
      onUpdateProject((p) => ({
        ...p,
        generatedNFTs: p.generatedNFTs.map((n) =>
          n.id === nft.id ? newNFT! : n,
        ),
      }));

      setSelectedNFT(newNFT);
      toast.success(`NFT #${nft.id} regenerated`);
    } else {
      toast.error("Regeneration failed");
    }

    setIsRegeneratingNFT(false);
  };

  const exportSingleNFT = async (nft: GeneratedNFT) => {
    try {
      const base64Data = nft.imageData.split(",")[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }

      const imageBlob = new Blob([bytes], { type: "image/png" });
      const imageUrl = URL.createObjectURL(imageBlob);
      const imageLink = document.createElement("a");
      imageLink.href = imageUrl;
      imageLink.download = `${project.name.replace(/\s+/g, "_")}_${nft.id}.png`;
      document.body.appendChild(imageLink);
      imageLink.click();
      document.body.removeChild(imageLink);
      URL.revokeObjectURL(imageUrl);

      const metadataJson = JSON.stringify(nft.metadata, null, 2);
      const metadataBlob = new Blob([metadataJson], {
        type: "application/json",
      });
      const metadataUrl = URL.createObjectURL(metadataBlob);
      const metadataLink = document.createElement("a");
      metadataLink.href = metadataUrl;
      metadataLink.download = `${project.name.replace(/\s+/g, "_")}_${nft.id}.json`;
      document.body.appendChild(metadataLink);
      metadataLink.click();
      document.body.removeChild(metadataLink);
      URL.revokeObjectURL(metadataUrl);

      toast.success("NFT exported");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
    }
  };

  const cancelGeneration = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "cancel" } as WorkerInputMessage);
      toast.info("Canceling generation...");
    }
  }, []);

  const compositeFallbackImages = async (
    nfts: GeneratedNFTData[],
  ): Promise<GeneratedNFT[]> => {
    const result: GeneratedNFT[] = [];

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];

      if (nft.imageData) {
        result.push(nft as GeneratedNFT);
      } else if (nft.selectedTraits) {
        try {
          const imageData = await generateImage(nft.selectedTraits);
          result.push({
            ...nft,
            imageData,
          } as GeneratedNFT);
        } catch (error) {
          console.error("Fallback compositing error:", error);
        }
      }

      if (i % 50 === 0) {
        await yieldToUI();
      }
    }

    return result;
  };

  const generateCollection = async () => {
    const currentSortOption = sortOption;
    const currentSearchQuery = searchQuery;
    const currentActiveFilters = new Map(activeFilters);
    const currentViewMode = viewMode;

    setIsGenerating(true);
    setProgress(0);
    setGeneratedCount(0);
    accumulatedNFTs.current = [];

    const validLayers = project.layers.filter((l) => l.traits.length > 0);
    if (validLayers.length === 0) {
      toast.error("Add layers first");
      setIsGenerating(false);
      return;
    }

    try {
      onUpdateProject((p) => ({
        ...p,
        generatedNFTs: [],
      }));

      workerRef.current = new Worker(
        new URL("../workers/vaultGenerator.worker.ts", import.meta.url),
        {
          type: "module",
        },
      );

      workerRef.current.onmessage = async (
        event: MessageEvent<WorkerOutputMessage>,
      ) => {
        const message = event.data;

        if (isCapabilityMessage(message)) {
          workerSupportsImageCompositing.current =
            message.payload.supportsImageCompositing;
          if (!message.payload.supportsImageCompositing) {
            console.log(
              "Worker does not support image compositing, will use main-thread fallback",
            );
          }
        } else if (isProgressMessage(message)) {
          setGeneratedCount(message.payload.generatedCount);
          setProgress(message.payload.percentage);
        } else if (isBatchResultMessage(message)) {
          let batchNFTs: GeneratedNFT[];

          if (!message.payload.supportsImageCompositing) {
            batchNFTs = await compositeFallbackImages(message.payload.nfts);
          } else {
            batchNFTs = message.payload.nfts as GeneratedNFT[];
          }

          accumulatedNFTs.current.push(...batchNFTs);

          onUpdateProject((p) => ({
            ...p,
            generatedNFTs: [...accumulatedNFTs.current],
          }));
        } else if (isCompleteMessage(message)) {
          const allGeneratedNFTs = [...accumulatedNFTs.current];
          allGeneratedNFTs.sort((a, b) => a.id - b.id);

          onUpdateProject((p) => ({
            ...p,
            generatedNFTs: allGeneratedNFTs,
            lastGeneratedAt: Date.now(),
          }));

          setSortOption(currentSortOption);
          setSearchQuery(currentSearchQuery);
          setActiveFilters(currentActiveFilters);
          setViewMode(currentViewMode);

          if (allGeneratedNFTs.length < project.collectionSize) {
            toast.warning(
              `Generated ${allGeneratedNFTs.length} of ${project.collectionSize}`,
            );
          } else {
            toast.success(`Generated ${allGeneratedNFTs.length} NFTs`);
          }

          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
          }
          imageCache.current = {};
          accumulatedNFTs.current = [];
          setIsGenerating(false);
          setProgress(0);
          setGeneratedCount(0);
        } else if (isCancelAckMessage(message)) {
          toast.warning(
            `Generation canceled at ${accumulatedNFTs.current.length} NFTs`,
          );

          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
          }
          imageCache.current = {};
          accumulatedNFTs.current = [];
          setIsGenerating(false);
          setProgress(0);
          setGeneratedCount(0);
        } else if (isErrorMessage(message)) {
          toast.error(message.payload.message);
          console.error("Worker error:", message.payload.details);

          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
          }
          imageCache.current = {};
          accumulatedNFTs.current = [];
          setIsGenerating(false);
          setProgress(0);
          setGeneratedCount(0);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error("Worker error:", error);
        toast.error("Generation failed");

        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        imageCache.current = {};
        accumulatedNFTs.current = [];
        setIsGenerating(false);
        setProgress(0);
        setGeneratedCount(0);
      };

      const layers: LayerData[] = project.layers.map((layer) => ({
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
      }));

      const rules: RuleData[] = project.rules.map((rule) => ({
        type: rule.type,
        primaryTrait: {
          layerId: rule.primaryTrait.layerId,
          traitId: rule.primaryTrait.traitId,
        },
        incompatibleTraits: rule.incompatibleTraits.map((t) => ({
          layerId: t.layerId,
          traitId: t.traitId,
        })),
      }));

      const forgedTokens: ForgedTokenData[] = project.customTokens.map(
        (token) => ({
          id: token.id,
          imageData: token.imageData || "",
        }),
      );

      const batchSize =
        project.collectionSize > 5000
          ? 100
          : project.collectionSize > 1000
            ? 250
            : 500;

      workerRef.current.postMessage({
        type: "start",
        payload: {
          layers,
          rules,
          forgedTokens,
          collectionSize: project.collectionSize,
          projectName: project.name,
          blockchain: project.blockchain,
          symbol: project.symbol,
          pixelArtMode: project.pixelArtMode,
          batchSize,
        },
      } as WorkerInputMessage);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Generation failed");

      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      imageCache.current = {};
      accumulatedNFTs.current = [];
      setIsGenerating(false);
      setProgress(0);
      setGeneratedCount(0);
    }
  };

  const createMetadata = (id: number, traits: Record<string, string>) => {
    const attributes = project.layers
      .filter((l) => traits[l.id])
      .map((layer) => {
        const trait = layer.traits.find((t) => t.id === traits[layer.id]);
        return {
          trait_type: layer.name,
          value: trait?.name || "Unknown",
        };
      });

    const baseMetadata = {
      name: `${project.name} #${id}`,
      description: `${project.name} NFT Collection`,
      image: `${id}.png`,
      attributes,
    };

    if (project.blockchain === "SOL") {
      return {
        ...baseMetadata,
        symbol: project.symbol,
        seller_fee_basis_points: 500,
        creators: [
          {
            address: "YOUR_WALLET_ADDRESS",
            share: 100,
          },
        ],
      };
    }

    return baseMetadata;
  };

  const exportCollection = async () => {
    if (project.generatedNFTs.length === 0) {
      toast.error("Generate collection first");
      return;
    }

    setIsExporting(true);
    toast.info("Exporting metadata...");

    try {
      const masterMetadata: any[] = project.generatedNFTs.map(
        (nft) => nft.metadata,
      );

      const blob = new Blob([JSON.stringify(masterMetadata, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, "_")}_metadata.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Metadata exported");
      setIsExporting(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
      setIsExporting(false);
    }
  };

  const downloadAllAsZip = async () => {
    if (project.generatedNFTs.length === 0) {
      toast.error("Generate collection first");
      return;
    }

    setIsExporting(true);
    setProgress(0);
    toast.info("Creating ZIP archive...");

    try {
      const zip = new SimpleZipCreator();

      const totalItems = project.generatedNFTs.length;

      for (let i = 0; i < project.generatedNFTs.length; i++) {
        const nft = project.generatedNFTs[i];

        const base64Data = nft.imageData.split(",")[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        zip.addFile(`images/${nft.id}.png`, bytes);

        const metadataJson = JSON.stringify(nft.metadata, null, 2);
        zip.addFile(`json/${nft.id}.json`, metadataJson);

        setProgress(((i + 1) / totalItems) * 90);
      }

      const masterMetadata = project.generatedNFTs.map((nft) => nft.metadata);
      zip.addFile("_metadata.json", JSON.stringify(masterMetadata, null, 2));

      toast.info("Compressing files...");

      const zipBlob = await zip.generate();

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, "_")}_collection.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);
      toast.success("Collection downloaded");

      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      console.error("ZIP export error:", error);
      toast.error("ZIP export failed");
      setIsExporting(false);
      setProgress(0);
    }
  };

  const isTraitActive = useCallback(
    (layerId: string, traitId: string): boolean => {
      return activeFilters.has(`${layerId}-${traitId}`);
    },
    [activeFilters],
  );

  const formatCollectionSize = (size: number): string => {
    return size.toLocaleString();
  };

  const shouldShowGrid = !isGenerating || !headlessMode;

  return (
    <div className="h-full flex flex-col lg:flex-row bg-background">
      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 border-r border-border bg-card/30 flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <FilterIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-xs font-semibold text-foreground">Layers</h2>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {project.generatedNFTs.length} items
          </p>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 scroll-momentum">
          <Accordion type="multiple" className="px-2 py-2">
            {groupedTraitsByLayer.map((layerGroup) => (
              <AccordionItem
                key={layerGroup.layerId}
                value={layerGroup.layerId}
                className="border-b border-border/50 last:border-0"
              >
                <AccordionTrigger className="py-3 px-2 hover:bg-muted/50 rounded text-left focus-ring transition-all duration-hover ease-apple">
                  <span className="text-xs font-semibold text-foreground">
                    {layerGroup.layerName}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-0.5 px-2">
                    {layerGroup.traits.map((trait) => {
                      const isActive = isTraitActive(
                        layerGroup.layerId,
                        trait.traitId,
                      );
                      return (
                        <button
                          type="button"
                          key={`${layerGroup.layerId}-${trait.traitId}`}
                          onClick={() =>
                            toggleTraitFilter(
                              layerGroup.layerId,
                              trait.traitId,
                              layerGroup.layerName,
                              trait.traitName,
                            )
                          }
                          className={`motion-button motion-press-snappy w-full flex items-center justify-between px-2 py-1.5 rounded text-left ${
                            isActive
                              ? "bg-foreground/10 text-foreground scale-100"
                              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="text-[11px] font-medium truncate pr-2">
                            {trait.traitName}
                          </span>
                          <span className="text-[10px] font-semibold flex-shrink-0">
                            {trait.percentage.toFixed(1)}%
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
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-4 lg:px-6 py-3 border-b border-border bg-background flex-shrink-0">
          <div className="flex flex-col gap-3">
            <VaultPublishingControls
              project={project}
              onUpdateProject={onUpdateProject}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="w-full sm:flex-1 sm:max-w-sm">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search collection..."
                    className="pl-9 h-9 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus-ring transition-all duration-component ease-apple"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <VaultViewModeToggle
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                <div className="hidden sm:block w-px h-6 bg-border" />

                <div className="flex items-center gap-1">
                  <Button
                    variant={sortOption === "index" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortOption("index")}
                    className="motion-button motion-press-snappy h-8 px-3 text-[10px] font-semibold uppercase tracking-wide focus-ring"
                  >
                    Index
                  </Button>
                  <Button
                    variant={sortOption === "rarity" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortOption("rarity")}
                    className="motion-button motion-press-snappy h-8 px-3 text-[10px] font-semibold uppercase tracking-wide focus-ring"
                  >
                    Rarity
                  </Button>
                  <Button
                    variant={sortOption === "common" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortOption("common")}
                    className="motion-button motion-press-snappy h-8 px-3 text-[10px] font-semibold uppercase tracking-wide focus-ring"
                  >
                    Common
                  </Button>
                </div>

                <Button
                  onClick={exportCollection}
                  disabled={isExporting || project.generatedNFTs.length === 0}
                  variant="outline"
                  size="sm"
                  className="motion-button motion-press-snappy h-8 px-3 text-[10px] font-semibold uppercase tracking-wide focus-ring"
                >
                  <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />
                  Export
                </Button>
              </div>
            </div>

            {activeFilters.size > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted/30 border border-border rounded-lg animate-fade-in-scale">
                <span className="text-[10px] font-medium text-foreground flex-1">
                  Active filters:{" "}
                  {Array.from(activeFilters.values())
                    .map((f) => f.traitName)
                    .join(", ")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="motion-button h-6 px-2 text-[10px] font-semibold focus-ring"
                >
                  Clear
                </Button>
              </div>
            )}

            {(isGenerating || isExporting) && (
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-muted-foreground font-medium">
                    {isGenerating
                      ? `Generating: ${generatedCount} / ${project.collectionSize} (${Math.round(progress)}%)`
                      : `${Math.round(progress)}%`}
                  </div>
                  {isGenerating && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelGeneration}
                      className="motion-button h-6 px-2 text-[10px] font-semibold focus-ring"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full scroll-momentum">
            {shouldShowGrid && project.generatedNFTs.length > 0 ? (
              <div className="p-4 lg:p-6">
                <div
                  className={`grid gap-3 stagger-grid ${
                    viewMode === "compact"
                      ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10"
                      : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  }`}
                >
                  {filteredAndSortedNFTs.map((nft) => {
                    const rarityInfo = getRarityInfo(nft);
                    const tokenName = String(
                      nft.metadata.name || `${project.name} #${nft.id}`,
                    );

                    return (
                      <Card
                        key={nft.id}
                        className="group bg-card border border-border hover:border-foreground/30 overflow-hidden cursor-pointer trait-card-lift focus-ring p-0"
                        onClick={() => setSelectedNFT(nft)}
                      >
                        <div className="aspect-square bg-muted/30 relative overflow-hidden">
                          <img
                            src={nft.imageData}
                            alt={tokenName}
                            className="w-full h-full object-cover block transition-transform duration-component ease-apple group-hover:scale-105"
                            style={{
                              imageRendering: project.pixelArtMode
                                ? "pixelated"
                                : "auto",
                            }}
                          />
                        </div>
                        <CardContent className="p-2">
                          <div className="text-[11px] font-medium text-foreground truncate">
                            {tokenName}
                          </div>
                          {viewMode === "grid" && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {rarityInfo.tier} • Rank #{rarityInfo.rank} /{" "}
                              {formatCollectionSize(project.collectionSize)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : !shouldShowGrid && isGenerating ? (
              <div className="h-full flex items-center justify-center p-4">
                <div className="text-center text-muted-foreground">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <div className="text-2xl font-bold mb-2">
                    Generating Collection
                  </div>
                  <p className="text-sm mb-1">Low-memory mode active</p>
                  <p className="text-xs">
                    {generatedCount} / {project.collectionSize} NFTs
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-4">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl font-bold mb-2">No NFTs</div>
                  <p className="text-sm">
                    Generate your collection to get started
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="px-4 lg:px-6 py-3 border-t border-border bg-background flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground font-medium">
                {filteredAndSortedNFTs.length} of {project.generatedNFTs.length}{" "}
                items
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="headless-mode"
                  checked={headlessMode}
                  onCheckedChange={setHeadlessMode}
                  disabled={isGenerating}
                  className="transition-all duration-hover ease-apple"
                />
                <Label
                  htmlFor="headless-mode"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Low-memory mode
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={generateCollection}
                disabled={isGenerating || project.collectionLocked}
                className="motion-button motion-press-snappy h-9 px-5 font-semibold text-xs focus-ring flex-1 sm:flex-initial"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>

              <Button
                onClick={downloadAllAsZip}
                disabled={isExporting || project.generatedNFTs.length === 0}
                variant="outline"
                className="motion-button motion-press-snappy h-9 px-5 font-semibold text-xs focus-ring flex-1 sm:flex-initial"
              >
                <DownloadIcon className="w-3.5 h-3.5 mr-2" />
                {isExporting ? `${Math.round(progress)}%` : "Download All"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {selectedNFT && (
        <div
          className="fixed inset-0 motion-modal-overlay z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedNFT(null)}
          onKeyUp={(e) => e.key === "Escape" && setSelectedNFT(null)}
        >
          <div
            className="modal-premium-enter bg-card border border-border rounded-xl w-full max-w-5xl overflow-hidden shadow-2xl"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-foreground">
                  {String(
                    selectedNFT.metadata.name ||
                      `${project.name} #${selectedNFT.id}`,
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground font-medium">
                  {getRarityInfo(selectedNFT).tier} • Rank #
                  {getRarityInfo(selectedNFT).rank}
                </div>
                <MotionIconButton
                  onClick={() => setSelectedNFT(null)}
                  className="h-8 w-8 text-foreground hover:bg-muted rounded focus-ring"
                >
                  <XIcon className="w-4 h-4" />
                </MotionIconButton>
              </div>
            </div>

            <ScrollArea
              className="scroll-momentum"
              style={{ maxHeight: "calc(85vh - 60px)" }}
            >
              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                  <div className="lg:col-span-3 space-y-3">
                    <div className="aspect-square rounded-xl overflow-hidden bg-muted/30 border border-border">
                      <img
                        src={selectedNFT.imageData}
                        alt={String(selectedNFT.metadata.name)}
                        className="w-full h-full object-contain"
                        style={{
                          imageRendering: project.pixelArtMode
                            ? "pixelated"
                            : "auto",
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {!selectedNFT.isForged && (
                        <Button
                          onClick={() => regenerateSingleNFT(selectedNFT)}
                          disabled={isRegeneratingNFT}
                          variant="outline"
                          className="motion-button motion-press-snappy h-9 text-xs font-semibold focus-ring"
                        >
                          <RefreshCwIcon
                            className={`w-3.5 h-3.5 mr-1.5 ${isRegeneratingNFT ? "animate-spin" : ""}`}
                          />
                          {isRegeneratingNFT ? "Regenerating..." : "Regenerate"}
                        </Button>
                      )}
                      <Button
                        onClick={() => exportSingleNFT(selectedNFT)}
                        variant="outline"
                        className={`motion-button motion-press-snappy h-9 text-xs font-semibold focus-ring ${selectedNFT.isForged ? "col-span-2" : ""}`}
                      >
                        <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />
                        Export
                      </Button>
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-muted-foreground mb-1">
                        Attributes
                      </h3>
                      <p className="text-[10px] text-muted-foreground">
                        {(selectedNFT.metadata.attributes as any[]).length}{" "}
                        traits
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 flex-1">
                      {(selectedNFT.metadata.attributes as any[]).map(
                        (attr) => {
                          if (
                            attr.trait_type === "Type" &&
                            attr.value === "1-of-1"
                          ) {
                            const isActive = isTraitActive("forged", "1-of-1");
                            return (
                              <button
                                type="button"
                                key={`forged-1of1-${attr.trait_type}-${attr.value}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTraitFilter(
                                    "forged",
                                    "1-of-1",
                                    "Type",
                                    "1-of-1",
                                  );
                                }}
                                className={`motion-button bg-muted/30 rounded-lg border p-3 hover:bg-muted/50 text-left focus-ring hover:scale-[1.02] active:scale-[0.98] ${
                                  isActive
                                    ? "border-foreground/30 bg-foreground/5"
                                    : "border-border"
                                }`}
                              >
                                <div className="text-[10px] font-medium text-muted-foreground mb-1">
                                  {attr.trait_type}
                                </div>
                                <div className="text-sm font-semibold text-foreground">
                                  {attr.value}
                                </div>
                              </button>
                            );
                          }

                          const layer = project.layers.find(
                            (l) => l.name === attr.trait_type,
                          );
                          const trait = layer?.traits.find(
                            (t) => t.name === attr.value,
                          );
                          const isActive =
                            layer && trait
                              ? isTraitActive(layer.id, trait.id)
                              : false;

                          return (
                            <button
                              type="button"
                              key={`attr-${attr.trait_type}-${attr.value}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (layer && trait) {
                                  toggleTraitFilter(
                                    layer.id,
                                    trait.id,
                                    layer.name,
                                    trait.name,
                                  );
                                }
                              }}
                              className={`motion-button bg-muted/30 rounded-lg border p-3 hover:bg-muted/50 text-left focus-ring hover:scale-[1.02] active:scale-[0.98] ${
                                isActive
                                  ? "border-foreground/30 bg-foreground/5"
                                  : "border-border"
                              }`}
                            >
                              <div className="text-[10px] font-medium text-muted-foreground mb-1">
                                {attr.trait_type}
                              </div>
                              <div className="text-sm font-semibold text-foreground mb-0.5">
                                {attr.value}
                              </div>
                              {trait && (
                                <div className="text-[10px] font-medium text-muted-foreground">
                                  {trait.weight.toFixed(1)}%
                                </div>
                              )}
                            </button>
                          );
                        },
                      )}
                    </div>

                    {activeFilters.size > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <Button
                          onClick={clearAllFilters}
                          variant="outline"
                          className="motion-button w-full h-9 text-xs font-semibold focus-ring"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
