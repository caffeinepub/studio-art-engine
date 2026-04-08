(function() {
  "use strict";
  let isCancelled = false;
  let supportsImageCompositing = false;
  function detectImageCompositing() {
    try {
      if (typeof OffscreenCanvas === "undefined") {
        return false;
      }
      if (typeof createImageBitmap === "undefined") {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
  supportsImageCompositing = detectImageCompositing();
  function generateDNA(traits, layers) {
    return layers.map((layer) => traits[layer.id] || "").join("-");
  }
  function isValidCombination(traits, rules) {
    for (const rule of rules) {
      const hasPrimary = traits[rule.primaryTrait.layerId] === rule.primaryTrait.traitId;
      if (!hasPrimary) continue;
      for (const incompatibleTrait of rule.incompatibleTraits) {
        const hasIncompatible = traits[incompatibleTrait.layerId] === incompatibleTrait.traitId;
        if (rule.type === "exclude" && hasIncompatible) {
          return false;
        }
        if (rule.type === "force" && !hasIncompatible) {
          return false;
        }
      }
    }
    return true;
  }
  async function loadImage(dataUrl) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return createImageBitmap(blob);
  }
  async function generateImage(traits, layers, pixelArtMode) {
    if (!supportsImageCompositing) {
      return null;
    }
    try {
      const canvas = new OffscreenCanvas(800, 800);
      const ctx = canvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false
      });
      if (!ctx) return null;
      if (pixelArtMode) {
        ctx.imageSmoothingEnabled = false;
      }
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        const traitId = traits[layer.id];
        if (!traitId) continue;
        const trait = layer.traits.find((t) => t.id === traitId);
        if (!trait) continue;
        const img = await loadImage(trait.imageData);
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(img, 0, 0, 800, 800);
        ctx.restore();
      }
      const blob = await canvas.convertToBlob({ type: "image/png" });
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Worker image generation error:", error);
      return null;
    }
  }
  function createMetadata(id, traits, layers, projectName, blockchain, symbol) {
    const attributes = layers.filter((l) => traits[l.id]).map((layer) => {
      const trait = layer.traits.find((t) => t.id === traits[layer.id]);
      return {
        trait_type: layer.name,
        value: (trait == null ? void 0 : trait.name) || "Unknown"
      };
    });
    const baseMetadata = {
      name: `${projectName} #${id}`,
      description: `${projectName} NFT Collection`,
      image: `${id}.png`,
      attributes
    };
    if (blockchain === "SOL") {
      return {
        ...baseMetadata,
        symbol,
        seller_fee_basis_points: 500,
        creators: [
          {
            address: "YOUR_WALLET_ADDRESS",
            share: 100
          }
        ]
      };
    }
    return baseMetadata;
  }
  async function generateCollection(layers, rules, forgedTokens, collectionSize, projectName, blockchain, symbol, pixelArtMode, batchSize) {
    isCancelled = false;
    const validLayers = layers.filter((l) => l.traits.length > 0);
    if (validLayers.length === 0) {
      postMessage({
        type: "error",
        payload: { message: "No valid layers found" }
      });
      return;
    }
    const allTokenNumbers = [];
    for (let i = 1; i <= collectionSize; i++) {
      allTokenNumbers.push(i);
    }
    const shuffledNumbers = [...allTokenNumbers].sort(() => Math.random() - 0.5);
    const forgedNFTs = forgedTokens.map((token, index) => {
      const newTokenNumber = shuffledNumbers[index];
      const metadata = {
        name: `${projectName} #${newTokenNumber}`,
        description: `${projectName} - Custom 1-of-1`,
        image: `${newTokenNumber}.png`,
        attributes: [{ trait_type: "Type", value: "1-of-1" }]
      };
      if (blockchain === "SOL") {
        Object.assign(metadata, {
          symbol,
          seller_fee_basis_points: 500,
          creators: [{ address: "YOUR_WALLET_ADDRESS", share: 100 }]
        });
      }
      return {
        id: newTokenNumber,
        dna: `forged-${token.id}`,
        imageData: token.imageData,
        metadata,
        isForged: true,
        forgedTokenId: token.id
      };
    });
    if (forgedNFTs.length > 0) {
      postMessage({
        type: "batch",
        payload: {
          nfts: forgedNFTs,
          supportsImageCompositing
        }
      });
      postMessage({
        type: "progress",
        payload: {
          generatedCount: forgedNFTs.length,
          totalCount: collectionSize,
          percentage: forgedNFTs.length / collectionSize * 100
        }
      });
    }
    const usedTokenNumbers = new Set(forgedNFTs.map((t) => t.id));
    const availableNumbers = shuffledNumbers.filter(
      (num) => !usedTokenNumbers.has(num)
    );
    const usedDNAs = new Set(forgedNFTs.map((t) => t.dna));
    let attempts = 0;
    const maxAttempts = collectionSize * 100;
    let availableIndex = 0;
    let currentBatch = [];
    let totalGenerated = forgedNFTs.length;
    while (totalGenerated < collectionSize && attempts < maxAttempts && availableIndex < availableNumbers.length) {
      if (isCancelled) {
        postMessage({
          type: "cancelAck"
        });
        return;
      }
      attempts++;
      const selectedTraits = {};
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
        const imageData = await generateImage(
          selectedTraits,
          layers,
          pixelArtMode
        );
        const metadata = createMetadata(
          tokenNumber,
          selectedTraits,
          layers,
          projectName,
          blockchain,
          symbol
        );
        const nft = {
          id: tokenNumber,
          dna,
          imageData: imageData || void 0,
          metadata,
          isForged: false,
          selectedTraits: imageData ? void 0 : selectedTraits
          // Include traits for fallback
        };
        currentBatch.push(nft);
        totalGenerated++;
        postMessage({
          type: "progress",
          payload: {
            generatedCount: totalGenerated,
            totalCount: collectionSize,
            percentage: totalGenerated / collectionSize * 100
          }
        });
        if (currentBatch.length >= batchSize) {
          postMessage({
            type: "batch",
            payload: {
              nfts: currentBatch,
              supportsImageCompositing
            }
          });
          currentBatch = [];
        }
      } catch (error) {
        console.error("Error generating NFT in worker:", error);
      }
    }
    if (currentBatch.length > 0) {
      postMessage({
        type: "batch",
        payload: {
          nfts: currentBatch,
          supportsImageCompositing
        }
      });
    }
    postMessage({
      type: "complete",
      payload: {
        totalGenerated
      }
    });
  }
  self.onmessage = async (event) => {
    const message = event.data;
    if (message.type === "start") {
      postMessage({
        type: "capability",
        payload: {
          supportsImageCompositing
        }
      });
      const {
        layers,
        rules,
        forgedTokens,
        collectionSize,
        projectName,
        blockchain,
        symbol,
        pixelArtMode,
        batchSize
      } = message.payload;
      await generateCollection(
        layers,
        rules,
        forgedTokens,
        collectionSize,
        projectName,
        blockchain,
        symbol,
        pixelArtMode,
        batchSize
      );
    } else if (message.type === "cancel") {
      isCancelled = true;
    }
  };
})();
