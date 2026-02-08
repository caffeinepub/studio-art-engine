/**
 * Web Worker for NFT collection generation.
 * Performs trait selection, rule validation, DNA uniqueness checks,
 * and optional image compositing off the main thread.
 */

import type {
  WorkerInputMessage,
  WorkerOutputMessage,
  LayerData,
  TraitData,
  RuleData,
  ForgedTokenData,
  GeneratedNFTData,
} from '../utils/vaultGeneratorProtocol';

let isCancelled = false;
let supportsImageCompositing = false;

// Feature detection for worker image compositing
function detectImageCompositing(): boolean {
  try {
    // Check for OffscreenCanvas support
    if (typeof OffscreenCanvas === 'undefined') {
      return false;
    }
    
    // Check for createImageBitmap support
    if (typeof createImageBitmap === 'undefined') {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// Initialize capabilities
supportsImageCompositing = detectImageCompositing();

// Generate deterministic DNA string from ordered layer list
function generateDNA(traits: Record<string, string>, layers: LayerData[]): string {
  return layers.map(layer => traits[layer.id] || '').join('-');
}

// Validate trait combination against rules
function isValidCombination(
  traits: Record<string, string>,
  rules: RuleData[]
): boolean {
  for (const rule of rules) {
    const hasPrimary = traits[rule.primaryTrait.layerId] === rule.primaryTrait.traitId;
    
    if (!hasPrimary) continue;

    for (const incompatibleTrait of rule.incompatibleTraits) {
      const hasIncompatible = traits[incompatibleTrait.layerId] === incompatibleTrait.traitId;
      
      if (rule.type === 'exclude' && hasIncompatible) {
        return false;
      }
      if (rule.type === 'force' && !hasIncompatible) {
        return false;
      }
    }
  }
  return true;
}

// Load image from data URL (worker-side)
async function loadImage(dataUrl: string): Promise<ImageBitmap> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

// Generate image using OffscreenCanvas (when supported)
async function generateImage(
  traits: Record<string, string>,
  layers: LayerData[],
  pixelArtMode: boolean,
  outputSize: number
): Promise<string | null> {
  if (!supportsImageCompositing) {
    return null;
  }

  try {
    const canvas = new OffscreenCanvas(outputSize, outputSize);
    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    if (!ctx) return null;

    if (pixelArtMode) {
      ctx.imageSmoothingEnabled = false;
    }

    // Draw layers in reverse order: lower layers first, higher layers last (on top)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const traitId = traits[layer.id];
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

    // Convert to PNG data URL
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Worker image generation error:', error);
    return null;
  }
}

// Create metadata for an NFT
function createMetadata(
  id: number,
  traits: Record<string, string>,
  layers: LayerData[],
  projectName: string,
  blockchain: string,
  symbol: string
) {
  const attributes = layers
    .filter((l) => traits[l.id])
    .map((layer) => {
      const trait = layer.traits.find((t) => t.id === traits[layer.id]);
      return {
        trait_type: layer.name,
        value: trait?.name || 'Unknown',
      };
    });

  const baseMetadata = {
    name: `${projectName} #${id}`,
    description: `${projectName} NFT Collection`,
    image: `${id}.png`,
    attributes,
  };

  if (blockchain === 'SOL') {
    return {
      ...baseMetadata,
      symbol: symbol,
      seller_fee_basis_points: 500,
      creators: [
        {
          address: 'YOUR_WALLET_ADDRESS',
          share: 100,
        },
      ],
    };
  }

  return baseMetadata;
}

// Main generation loop
async function generateCollection(
  layers: LayerData[],
  rules: RuleData[],
  forgedTokens: ForgedTokenData[],
  collectionSize: number,
  projectName: string,
  blockchain: string,
  symbol: string,
  pixelArtMode: boolean,
  batchSize: number,
  outputSize: number
) {
  isCancelled = false;

  const validLayers = layers.filter((l) => l.traits.length > 0);
  if (validLayers.length === 0) {
    postMessage({
      type: 'error',
      payload: { message: 'No valid layers found' },
    } as WorkerOutputMessage);
    return;
  }

  // Generate forged tokens
  const allTokenNumbers: number[] = [];
  for (let i = 1; i <= collectionSize; i++) {
    allTokenNumbers.push(i);
  }
  
  const shuffledNumbers = [...allTokenNumbers].sort(() => Math.random() - 0.5);
  
  const forgedNFTs: GeneratedNFTData[] = forgedTokens.map((token, index) => {
    const newTokenNumber = shuffledNumbers[index];
    
    const metadata = {
      name: `${projectName} #${newTokenNumber}`,
      description: `${projectName} - Custom 1-of-1`,
      image: `${newTokenNumber}.png`,
      attributes: [{ trait_type: 'Type', value: '1-of-1' }],
    };

    if (blockchain === 'SOL') {
      Object.assign(metadata, {
        symbol: symbol,
        seller_fee_basis_points: 500,
        creators: [{ address: 'YOUR_WALLET_ADDRESS', share: 100 }],
      });
    }

    return {
      id: newTokenNumber,
      dna: `forged-${token.id}`,
      imageData: token.imageData,
      metadata,
      isForged: true,
      forgedTokenId: token.id,
    };
  });

  // Send forged tokens as first batch
  if (forgedNFTs.length > 0) {
    postMessage({
      type: 'batch',
      payload: {
        nfts: forgedNFTs,
        supportsImageCompositing,
      },
    } as WorkerOutputMessage);

    postMessage({
      type: 'progress',
      payload: {
        generatedCount: forgedNFTs.length,
        totalCount: collectionSize,
        percentage: (forgedNFTs.length / collectionSize) * 100,
      },
    } as WorkerOutputMessage);
  }

  const usedTokenNumbers = new Set(forgedNFTs.map(t => t.id));
  const availableNumbers: number[] = shuffledNumbers.filter(num => !usedTokenNumbers.has(num));
  const usedDNAs = new Set<string>(forgedNFTs.map(t => t.dna));

  let attempts = 0;
  const maxAttempts = collectionSize * 100;
  let availableIndex = 0;
  let currentBatch: GeneratedNFTData[] = [];
  let totalGenerated = forgedNFTs.length;

  while (totalGenerated < collectionSize && attempts < maxAttempts && availableIndex < availableNumbers.length) {
    // Check for cancellation
    if (isCancelled) {
      postMessage({
        type: 'cancelAck',
      } as WorkerOutputMessage);
      return;
    }

    attempts++;

    // Select traits using weighted random
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

    const dna = generateDNA(selectedTraits, layers);
    if (usedDNAs.has(dna)) continue;
    if (!isValidCombination(selectedTraits, rules)) continue;

    usedDNAs.add(dna);

    try {
      const tokenNumber = availableNumbers[availableIndex];
      availableIndex++;

      // Try to generate image in worker
      const imageData = await generateImage(selectedTraits, layers, pixelArtMode, outputSize);
      
      const metadata = createMetadata(tokenNumber, selectedTraits, layers, projectName, blockchain, symbol);

      const nft: GeneratedNFTData = {
        id: tokenNumber,
        dna,
        imageData: imageData || undefined,
        metadata,
        isForged: false,
        selectedTraits: imageData ? undefined : selectedTraits, // Include traits for fallback
      };

      currentBatch.push(nft);
      totalGenerated++;

      // Send progress update
      postMessage({
        type: 'progress',
        payload: {
          generatedCount: totalGenerated,
          totalCount: collectionSize,
          percentage: (totalGenerated / collectionSize) * 100,
        },
      } as WorkerOutputMessage);

      // Send batch when full
      if (currentBatch.length >= batchSize) {
        postMessage({
          type: 'batch',
          payload: {
            nfts: currentBatch,
            supportsImageCompositing,
          },
        } as WorkerOutputMessage);
        
        currentBatch = [];
      }
    } catch (error) {
      console.error('Error generating NFT in worker:', error);
    }
  }

  // Send final batch if any remaining
  if (currentBatch.length > 0) {
    postMessage({
      type: 'batch',
      payload: {
        nfts: currentBatch,
        supportsImageCompositing,
      },
    } as WorkerOutputMessage);
  }

  // Send completion message
  postMessage({
    type: 'complete',
    payload: {
      totalGenerated,
    },
  } as WorkerOutputMessage);
}

// Message handler
self.onmessage = async (event: MessageEvent<WorkerInputMessage>) => {
  const message = event.data;

  if (message.type === 'start') {
    // Send capability info first
    postMessage({
      type: 'capability',
      payload: {
        supportsImageCompositing,
      },
    } as WorkerOutputMessage);

    const { layers, rules, forgedTokens, collectionSize, projectName, blockchain, symbol, pixelArtMode, batchSize, outputSize } = message.payload;
    
    await generateCollection(
      layers,
      rules,
      forgedTokens,
      collectionSize,
      projectName,
      blockchain,
      symbol,
      pixelArtMode,
      batchSize,
      outputSize || 800
    );
  } else if (message.type === 'cancel') {
    isCancelled = true;
  }
};
