/**
 * Web Worker for NFT collection generation.
 * Performs trait selection, rule validation, DNA uniqueness checks,
 * and image compositing off the main thread.
 * Supports animated GIF generation when traits contain GIF files.
 * Uses a pure-TypeScript GIF parser and encoder for full animation support.
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

// ─── Feature detection ─────────────────────────────────────────────────────────

function detectImageCompositing(): boolean {
  try {
    if (typeof OffscreenCanvas === 'undefined') return false;
    if (typeof createImageBitmap === 'undefined') return false;
    return true;
  } catch {
    return false;
  }
}

supportsImageCompositing = detectImageCompositing();

// ─── DNA / validation helpers ──────────────────────────────────────────────────

function generateDNA(traits: Record<string, string>, layers: LayerData[]): string {
  return layers.map(layer => traits[layer.id] || '').join('-');
}

function isValidCombination(traits: Record<string, string>, rules: RuleData[]): boolean {
  for (const rule of rules) {
    const hasPrimary = traits[rule.primaryTrait.layerId] === rule.primaryTrait.traitId;
    if (!hasPrimary) continue;
    for (const incompatibleTrait of rule.incompatibleTraits) {
      const hasIncompatible = traits[incompatibleTrait.layerId] === incompatibleTrait.traitId;
      if (rule.type === 'exclude' && hasIncompatible) return false;
      if (rule.type === 'force' && !hasIncompatible) return false;
    }
  }
  return true;
}

// ─── GIF detection ─────────────────────────────────────────────────────────────

function isGifDataUrl(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/gif');
}

// ─── Pure-TS GIF Parser ────────────────────────────────────────────────────────

interface GifFrame {
  imageData: ImageData;
  delay: number; // centiseconds
}

interface ParsedGif {
  width: number;
  height: number;
  frames: GifFrame[];
  isAnimated: boolean;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function lzwDecompress(compressed: number[], minCodeSize: number, pixelCount: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eofCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let codeMask = (1 << codeSize) - 1;

  const initTable: number[][] = [];
  for (let i = 0; i < clearCode; i++) initTable.push([i]);
  initTable.push([]); // clear
  initTable.push([]); // eof

  let table = initTable.map(e => [...e]);
  let nextCode = eofCode + 1;

  let bitBuffer = 0;
  let bitsInBuffer = 0;
  let bytePos = 0;

  function readCode(): number {
    while (bitsInBuffer < codeSize && bytePos < compressed.length) {
      bitBuffer |= compressed[bytePos++] << bitsInBuffer;
      bitsInBuffer += 8;
    }
    const code = bitBuffer & codeMask;
    bitBuffer >>= codeSize;
    bitsInBuffer -= codeSize;
    return code;
  }

  const output: number[] = [];
  let prevCode = -1;

  while (output.length < pixelCount) {
    const code = readCode();
    if (code === clearCode) {
      table = initTable.map(e => [...e]);
      nextCode = eofCode + 1;
      codeSize = minCodeSize + 1;
      codeMask = (1 << codeSize) - 1;
      prevCode = -1;
      continue;
    }
    if (code === eofCode) break;

    let entry: number[];
    if (code < table.length) {
      entry = table[code];
    } else if (code === nextCode && prevCode >= 0) {
      entry = [...table[prevCode], table[prevCode][0]];
    } else {
      break;
    }

    output.push(...entry);

    if (prevCode >= 0 && nextCode < 4096) {
      table.push([...table[prevCode], entry[0]]);
      nextCode++;
      if (nextCode === (1 << codeSize) && codeSize < 12) {
        codeSize++;
        codeMask = (1 << codeSize) - 1;
      }
    }
    prevCode = code;
  }

  return output.slice(0, pixelCount);
}

function deinterlace(pixels: number[], width: number, height: number): number[] {
  const result = new Array(width * height);
  const passes = [
    { start: 0, step: 8 },
    { start: 4, step: 8 },
    { start: 2, step: 4 },
    { start: 1, step: 2 },
  ];
  let srcIdx = 0;
  for (const pass of passes) {
    for (let y = pass.start; y < height; y += pass.step) {
      for (let x = 0; x < width; x++) {
        result[y * width + x] = pixels[srcIdx++];
      }
    }
  }
  return result;
}

function parseGif(dataUrl: string): ParsedGif | null {
  try {
    const data = dataUrlToBytes(dataUrl);
    let pos = 0;

    function readByte(): number { return data[pos++]; }
    function readUint16(): number { const v = data[pos] | (data[pos + 1] << 8); pos += 2; return v; }
    function readBytes(n: number): Uint8Array { const s = data.slice(pos, pos + n); pos += n; return s; }

    const sig = String.fromCharCode(data[0], data[1], data[2]);
    if (sig !== 'GIF') return null;
    pos = 6;

    const logicalWidth = readUint16();
    const logicalHeight = readUint16();
    const packed = readByte();
    const hasGlobalColorTable = (packed >> 7) & 1;
    const globalColorTableSize = 3 * (2 ** ((packed & 0x07) + 1));
    readByte(); // bg color index
    readByte(); // pixel aspect ratio

    let globalColorTable: Uint8Array | null = null;
    if (hasGlobalColorTable) {
      globalColorTable = readBytes(globalColorTableSize);
    }

    const frames: GifFrame[] = [];
    let graphicControl = { delay: 10, transparentColorIndex: -1, disposalMethod: 0 };

    const canvas = new OffscreenCanvas(logicalWidth, logicalHeight);
    const ctx = canvas.getContext('2d')!;

    while (pos < data.length) {
      const introducer = readByte();
      if (introducer === 0x3B) break; // Trailer

      if (introducer === 0x21) {
        const label = readByte();
        if (label === 0xF9) {
          readByte(); // block size
          const gcPacked = readByte();
          graphicControl.disposalMethod = (gcPacked >> 3) & 0x07;
          const hasTransparent = gcPacked & 0x01;
          graphicControl.delay = readUint16();
          const transparentIdx = readByte();
          graphicControl.transparentColorIndex = hasTransparent ? transparentIdx : -1;
          readByte(); // block terminator
        } else {
          let blockSize = readByte();
          while (blockSize > 0) { pos += blockSize; blockSize = readByte(); }
        }
      } else if (introducer === 0x2C) {
        const left = readUint16();
        const top = readUint16();
        const width = readUint16();
        const height = readUint16();
        const imgPacked = readByte();
        const hasLocalColorTable = (imgPacked >> 7) & 1;
        const isInterlaced = (imgPacked >> 6) & 1;
        const localColorTableSize = hasLocalColorTable ? 3 * (2 ** ((imgPacked & 0x07) + 1)) : 0;

        let colorTable = globalColorTable;
        if (hasLocalColorTable) {
          colorTable = readBytes(localColorTableSize);
        }

        const lzwMinCodeSize = readByte();
        const compressedData: number[] = [];
        let blockSize = readByte();
        while (blockSize > 0) {
          for (let i = 0; i < blockSize; i++) compressedData.push(data[pos++]);
          blockSize = readByte();
        }

        const pixelIndices = lzwDecompress(compressedData, lzwMinCodeSize, width * height);
        const finalIndices = isInterlaced ? deinterlace(pixelIndices, width, height) : pixelIndices;

        const frameImageData = new ImageData(width, height);
        const transparentIdx = graphicControl.transparentColorIndex;

        for (let i = 0; i < finalIndices.length; i++) {
          const idx = finalIndices[i];
          const isTransparent = transparentIdx >= 0 && idx === transparentIdx;
          if (!isTransparent && colorTable) {
            frameImageData.data[i * 4] = colorTable[idx * 3];
            frameImageData.data[i * 4 + 1] = colorTable[idx * 3 + 1];
            frameImageData.data[i * 4 + 2] = colorTable[idx * 3 + 2];
            frameImageData.data[i * 4 + 3] = 255;
          } else {
            frameImageData.data[i * 4 + 3] = 0;
          }
        }

        if (graphicControl.disposalMethod === 2) {
          ctx.clearRect(left, top, width, height);
        } else if (graphicControl.disposalMethod === 3) {
          ctx.clearRect(left, top, width, height);
        }

        ctx.putImageData(frameImageData, left, top);
        const fullFrameData = ctx.getImageData(0, 0, logicalWidth, logicalHeight);

        frames.push({
          imageData: fullFrameData,
          delay: graphicControl.delay > 0 ? graphicControl.delay : 10,
        });

        graphicControl = { delay: 10, transparentColorIndex: -1, disposalMethod: 0 };
      } else {
        break;
      }
    }

    return { width: logicalWidth, height: logicalHeight, frames, isAnimated: frames.length > 1 };
  } catch {
    return null;
  }
}

// ─── GIF Encoder ───────────────────────────────────────────────────────────────

function lzwCompress(pixels: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eofCode = clearCode + 1;
  const output: number[] = [];
  let bitBuffer = 0;
  let bitsInBuffer = 0;
  let codeSize = minCodeSize + 1;

  function writeCode(code: number) {
    bitBuffer |= code << bitsInBuffer;
    bitsInBuffer += codeSize;
    while (bitsInBuffer >= 8) {
      output.push(bitBuffer & 0xFF);
      bitBuffer >>= 8;
      bitsInBuffer -= 8;
    }
  }

  function flush() {
    if (bitsInBuffer > 0) { output.push(bitBuffer & 0xFF); bitBuffer = 0; bitsInBuffer = 0; }
  }

  const table = new Map<string, number>();
  let nextCode = eofCode + 1;

  function resetTable() {
    table.clear();
    for (let i = 0; i < clearCode; i++) table.set(String.fromCharCode(i), i);
    nextCode = eofCode + 1;
    codeSize = minCodeSize + 1;
  }

  resetTable();
  writeCode(clearCode);

  let index = 0;
  let indexBuffer = String.fromCharCode(pixels[index++]);

  while (index < pixels.length) {
    const k = String.fromCharCode(pixels[index++]);
    const combined = indexBuffer + k;
    if (table.has(combined)) {
      indexBuffer = combined;
    } else {
      writeCode(table.get(indexBuffer)!);
      if (nextCode < 4096) {
        table.set(combined, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
      } else {
        writeCode(clearCode);
        resetTable();
      }
      indexBuffer = k;
    }
  }

  writeCode(table.get(indexBuffer)!);
  writeCode(eofCode);
  flush();
  return output;
}

function medianCut(data: Uint8ClampedArray, pixelCount: number, maxColors: number): Array<[number, number, number]> {
  const pixels: Array<[number, number, number]> = [];
  for (let i = 0; i < pixelCount; i++) {
    if (data[i * 4 + 3] >= 128) pixels.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
  }
  if (pixels.length === 0) return [[0, 0, 0]];

  function splitBucket(bucket: Array<[number, number, number]>, depth: number): Array<[number, number, number]> {
    if (depth === 0 || bucket.length === 0) {
      let r = 0, g = 0, b = 0;
      for (const [pr, pg, pb] of bucket) { r += pr; g += pg; b += pb; }
      const n = bucket.length;
      return [[Math.round(r / n), Math.round(g / n), Math.round(b / n)]];
    }
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (const [r, g, b] of bucket) {
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (g < minG) minG = g; if (g > maxG) maxG = g;
      if (b < minB) minB = b; if (b > maxB) maxB = b;
    }
    const rangeR = maxR - minR, rangeG = maxG - minG, rangeB = maxB - minB;
    const channel = rangeR >= rangeG && rangeR >= rangeB ? 0 : rangeG >= rangeB ? 1 : 2;
    bucket.sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(bucket.length / 2);
    return [...splitBucket(bucket.slice(0, mid), depth - 1), ...splitBucket(bucket.slice(mid), depth - 1)];
  }

  const depth = Math.ceil(Math.log2(maxColors));
  return splitBucket(pixels, depth).slice(0, maxColors);
}

function findClosestColor(r: number, g: number, b: number, palette: Array<[number, number, number]>): number {
  let bestIdx = 0, bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const dr = r - palette[i][0], dg = g - palette[i][1], db = b - palette[i][2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) { bestDist = dist; bestIdx = i; }
  }
  return bestIdx;
}

interface QuantizeResult {
  palette: Uint8Array;
  indexedPixels: Uint8Array;
  transparentIndex: number;
}

function quantizeFrame(imageData: ImageData): QuantizeResult {
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  const palette = new Uint8Array(256 * 3);
  const indexedPixels = new Uint8Array(pixelCount);
  let transparentIndex = -1;

  const colorMap = new Map<number, number>();
  let hasTransparency = false;

  for (let i = 0; i < pixelCount; i++) {
    const a = data[i * 4 + 3];
    if (a < 128) {
      hasTransparency = true;
    } else {
      const qr = data[i * 4] & 0xFC;
      const qg = data[i * 4 + 1] & 0xFC;
      const qb = data[i * 4 + 2] & 0xFC;
      const key = (qr << 16) | (qg << 8) | qb;
      if (!colorMap.has(key)) colorMap.set(key, colorMap.size);
    }
  }

  const maxColors = hasTransparency ? 255 : 256;
  const colors = Array.from(colorMap.entries());
  const paletteColors: Array<[number, number, number]> = [];

  if (colors.length <= maxColors) {
    for (const [key] of colors) {
      paletteColors.push([(key >> 16) & 0xFF, (key >> 8) & 0xFF, key & 0xFF]);
    }
  } else {
    paletteColors.push(...medianCut(data, pixelCount, maxColors));
  }

  for (let i = 0; i < paletteColors.length && i < maxColors; i++) {
    palette[i * 3] = paletteColors[i][0];
    palette[i * 3 + 1] = paletteColors[i][1];
    palette[i * 3 + 2] = paletteColors[i][2];
  }

  if (hasTransparency) {
    transparentIndex = 255;
    palette[255 * 3] = 0; palette[255 * 3 + 1] = 0; palette[255 * 3 + 2] = 0;
  }

  for (let i = 0; i < pixelCount; i++) {
    const a = data[i * 4 + 3];
    if (a < 128) {
      indexedPixels[i] = transparentIndex >= 0 ? transparentIndex : 0;
    } else {
      indexedPixels[i] = findClosestColor(data[i * 4], data[i * 4 + 1], data[i * 4 + 2], paletteColors);
    }
  }

  return { palette, indexedPixels, transparentIndex };
}

function encodeAnimatedGif(
  frames: Array<{ imageData: ImageData; delay: number }>,
  width: number,
  height: number
): string {
  const bytes: number[] = [];

  function writeByte(b: number) { bytes.push(b & 0xFF); }
  function writeUint16(v: number) { bytes.push(v & 0xFF); bytes.push((v >> 8) & 0xFF); }
  function writeString(s: string) { for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i)); }

  // Header
  writeString('GIF89a');
  writeUint16(width);
  writeUint16(height);

  // Global color table (use first frame's palette)
  const { palette: gPalette } = quantizeFrame(frames[0].imageData);
  writeByte(0x80 | 7); // global color table, 256 colors
  writeByte(0); // bg color index
  writeByte(0); // pixel aspect ratio
  for (let i = 0; i < 256; i++) {
    writeByte(gPalette[i * 3]); writeByte(gPalette[i * 3 + 1]); writeByte(gPalette[i * 3 + 2]);
  }

  // Netscape looping extension
  writeByte(0x21); writeByte(0xFF); writeByte(11);
  writeString('NETSCAPE2.0');
  writeByte(3); writeByte(1); writeUint16(0); writeByte(0);

  for (const frame of frames) {
    const { palette, indexedPixels, transparentIndex } = quantizeFrame(frame.imageData);

    // Graphic Control Extension
    writeByte(0x21); writeByte(0xF9); writeByte(4);
    const gcPacked = (2 << 3) | (transparentIndex >= 0 ? 1 : 0);
    writeByte(gcPacked);
    writeUint16(frame.delay);
    writeByte(transparentIndex >= 0 ? transparentIndex : 0);
    writeByte(0);

    // Image Descriptor with local color table
    writeByte(0x2C);
    writeUint16(0); writeUint16(0); writeUint16(width); writeUint16(height);
    writeByte(0x80 | 7); // local color table, 256 colors

    for (let i = 0; i < 256; i++) {
      writeByte(palette[i * 3]); writeByte(palette[i * 3 + 1]); writeByte(palette[i * 3 + 2]);
    }

    // LZW compressed image data
    const lzwMinCodeSize = 8;
    writeByte(lzwMinCodeSize);
    const compressed = lzwCompress(indexedPixels, lzwMinCodeSize);

    let offset = 0;
    while (offset < compressed.length) {
      const blockSize = Math.min(255, compressed.length - offset);
      writeByte(blockSize);
      for (let i = 0; i < blockSize; i++) writeByte(compressed[offset + i]);
      offset += blockSize;
    }
    writeByte(0);
  }

  writeByte(0x3B); // Trailer

  // Convert to base64 data URL
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:image/gif;base64,${btoa(binary)}`;
}

// ─── Image loading ─────────────────────────────────────────────────────────────

async function loadImage(dataUrl: string): Promise<ImageBitmap> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

// ─── Compositing ───────────────────────────────────────────────────────────────

function compositeImageData(
  base: ImageData,
  overlay: ImageData,
  blendMode: string,
  opacity: number
): ImageData {
  const result = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
  const pixelCount = base.width * base.height;

  for (let i = 0; i < pixelCount; i++) {
    const bi = i * 4;
    const sr = overlay.data[bi];
    const sg = overlay.data[bi + 1];
    const sb = overlay.data[bi + 2];
    const sa = (overlay.data[bi + 3] / 255) * opacity;

    if (sa <= 0) continue;

    const dr = result.data[bi];
    const dg = result.data[bi + 1];
    const db = result.data[bi + 2];
    const da = result.data[bi + 3] / 255;

    let outR: number, outG: number, outB: number;

    switch (blendMode) {
      case 'multiply':
        outR = (dr * sr) / 255; outG = (dg * sg) / 255; outB = (db * sb) / 255;
        break;
      case 'screen':
        outR = 255 - ((255 - dr) * (255 - sr)) / 255;
        outG = 255 - ((255 - dg) * (255 - sg)) / 255;
        outB = 255 - ((255 - db) * (255 - sb)) / 255;
        break;
      case 'overlay':
        outR = dr < 128 ? (2 * dr * sr) / 255 : 255 - (2 * (255 - dr) * (255 - sr)) / 255;
        outG = dg < 128 ? (2 * dg * sg) / 255 : 255 - (2 * (255 - dg) * (255 - sg)) / 255;
        outB = db < 128 ? (2 * db * sb) / 255 : 255 - (2 * (255 - db) * (255 - sb)) / 255;
        break;
      default: // normal
        outR = sr; outG = sg; outB = sb;
        break;
    }

    const outA = sa + da * (1 - sa);
    if (outA > 0) {
      result.data[bi] = Math.round((outR * sa + dr * da * (1 - sa)) / outA);
      result.data[bi + 1] = Math.round((outG * sa + dg * da * (1 - sa)) / outA);
      result.data[bi + 2] = Math.round((outB * sa + db * da * (1 - sa)) / outA);
      result.data[bi + 3] = Math.round(outA * 255);
    }
  }

  return result;
}

// ─── Static image generation ───────────────────────────────────────────────────

async function generateImage(
  traits: Record<string, string>,
  layers: LayerData[],
  pixelArtMode: boolean
): Promise<string | null> {
  if (!supportsImageCompositing) return null;

  try {
    const canvas = new OffscreenCanvas(800, 800);
    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    if (!ctx) return null;

    if (pixelArtMode) ctx.imageSmoothingEnabled = false;

    // Draw layers in render order: lower index = lower layer (drawn first)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const traitId = traits[layer.id];
      if (!traitId) continue;
      const trait = layer.traits.find(t => t.id === traitId);
      if (!trait) continue;

      const img = await loadImage(trait.imageData);
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
      ctx.drawImage(img, 0, 0, 800, 800);
      ctx.restore();
    }

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const reader = new FileReader();
    return new Promise(resolve => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Animated GIF generation ───────────────────────────────────────────────────

async function generateAnimatedGif(
  traits: Record<string, string>,
  layers: LayerData[],
  pixelArtMode: boolean
): Promise<{ dataUrl: string; isGif: boolean } | null> {
  if (!supportsImageCompositing) return null;

  try {
    // Ordered layers: lower index = lower layer (drawn first, i.e. bottom)
    const orderedLayers = [...layers].reverse();

    interface LayerInfo {
      layer: LayerData;
      parsedGif: ParsedGif | null;
      staticBitmap: ImageBitmap | null;
      isAnimatedGif: boolean;
    }

    const layerInfos: LayerInfo[] = [];
    let hasAnimatedGif = false;

    for (const layer of orderedLayers) {
      const traitId = traits[layer.id];
      if (!traitId) {
        layerInfos.push({ layer, parsedGif: null, staticBitmap: null, isAnimatedGif: false });
        continue;
      }
      const trait = layer.traits.find(t => t.id === traitId);
      if (!trait) {
        layerInfos.push({ layer, parsedGif: null, staticBitmap: null, isAnimatedGif: false });
        continue;
      }

      if (isGifDataUrl(trait.imageData)) {
        const parsed = parseGif(trait.imageData);
        if (parsed && parsed.isAnimated) {
          hasAnimatedGif = true;
          layerInfos.push({ layer, parsedGif: parsed, staticBitmap: null, isAnimatedGif: true });
        } else {
          // Static GIF or failed parse - treat as static
          const bitmap = await loadImage(trait.imageData);
          layerInfos.push({ layer, parsedGif: null, staticBitmap: bitmap, isAnimatedGif: false });
        }
      } else {
        const bitmap = await loadImage(trait.imageData);
        layerInfos.push({ layer, parsedGif: null, staticBitmap: bitmap, isAnimatedGif: false });
      }
    }

    if (!hasAnimatedGif) {
      // No animated GIFs - generate static PNG
      const canvas = new OffscreenCanvas(800, 800);
      const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
      if (!ctx) return null;
      if (pixelArtMode) ctx.imageSmoothingEnabled = false;

      for (const info of layerInfos) {
        if (!info.staticBitmap) continue;
        ctx.save();
        ctx.globalAlpha = info.layer.opacity / 100;
        ctx.globalCompositeOperation = info.layer.blendMode as GlobalCompositeOperation;
        ctx.drawImage(info.staticBitmap, 0, 0, 800, 800);
        ctx.restore();
      }

      const blob = await canvas.convertToBlob({ type: 'image/png' });
      const reader = new FileReader();
      const dataUrl = await new Promise<string>(resolve => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      return { dataUrl, isGif: false };
    }

    // Has animated GIFs - composite each frame
    const animatedInfos = layerInfos.filter(i => i.isAnimatedGif && i.parsedGif);
    const maxFrameCount = Math.max(...animatedInfos.map(i => i.parsedGif!.frames.length));
    const primaryDelay = animatedInfos[0].parsedGif!.frames[0]?.delay ?? 10;

    // Pre-scale animated GIF frames to 800x800
    for (const info of layerInfos) {
      if (!info.parsedGif) continue;
      const scaledFrames: GifFrame[] = [];
      for (const frame of info.parsedGif.frames) {
        const srcCanvas = new OffscreenCanvas(info.parsedGif.width, info.parsedGif.height);
        const srcCtx = srcCanvas.getContext('2d')!;
        srcCtx.putImageData(frame.imageData, 0, 0);

        const dstCanvas = new OffscreenCanvas(800, 800);
        const dstCtx = dstCanvas.getContext('2d')!;
        if (pixelArtMode) dstCtx.imageSmoothingEnabled = false;
        dstCtx.drawImage(srcCanvas, 0, 0, 800, 800);

        scaledFrames.push({
          imageData: dstCtx.getImageData(0, 0, 800, 800),
          delay: frame.delay,
        });
      }
      info.parsedGif = { ...info.parsedGif, frames: scaledFrames, width: 800, height: 800 };
    }

    // Pre-render static layers to ImageData
    const staticImageDatas: Map<LayerInfo, ImageData> = new Map();
    for (const info of layerInfos) {
      if (info.staticBitmap) {
        const tmpCanvas = new OffscreenCanvas(800, 800);
        const tmpCtx = tmpCanvas.getContext('2d')!;
        if (pixelArtMode) tmpCtx.imageSmoothingEnabled = false;
        tmpCtx.drawImage(info.staticBitmap, 0, 0, 800, 800);
        staticImageDatas.set(info, tmpCtx.getImageData(0, 0, 800, 800));
      }
    }

    // Composite each frame
    const outputFrames: Array<{ imageData: ImageData; delay: number }> = [];

    for (let fi = 0; fi < maxFrameCount; fi++) {
      let composited = new ImageData(800, 800);

      for (const info of layerInfos) {
        if (!info.layer) continue;
        const opacity = info.layer.opacity / 100;
        const blendMode = info.layer.blendMode;

        let layerImageData: ImageData | null = null;

        if (info.isAnimatedGif && info.parsedGif) {
          const frameIdx = fi % info.parsedGif.frames.length;
          layerImageData = info.parsedGif.frames[frameIdx].imageData;
        } else {
          layerImageData = staticImageDatas.get(info) ?? null;
        }

        if (!layerImageData) continue;
        composited = compositeImageData(composited, layerImageData, blendMode, opacity);
      }

      const frameDelay = animatedInfos[0].parsedGif!.frames[fi % animatedInfos[0].parsedGif!.frames.length]?.delay ?? primaryDelay;
      outputFrames.push({ imageData: composited, delay: frameDelay });
    }

    const dataUrl = encodeAnimatedGif(outputFrames, 800, 800);
    return { dataUrl, isGif: true };
  } catch {
    return null;
  }
}

// ─── Metadata builder ──────────────────────────────────────────────────────────

function createMetadata(
  id: number,
  traits: Record<string, string>,
  layers: LayerData[],
  projectName: string,
  blockchain: string,
  symbol: string,
  outputFormat: string
) {
  const attributes = layers
    .filter(l => traits[l.id])
    .map(layer => {
      const trait = layer.traits.find(t => t.id === traits[layer.id]);
      return { trait_type: layer.name, value: trait?.name || 'Unknown' };
    });

  const fileExtension = outputFormat === 'gif' ? 'gif' : 'png';

  const baseMetadata = {
    name: `${projectName} #${id}`,
    description: `${projectName} NFT Collection`,
    image: `${id}.${fileExtension}`,
    attributes,
  };

  if (blockchain === 'SOL') {
    return {
      ...baseMetadata,
      symbol,
      seller_fee_basis_points: 500,
      creators: [{ address: 'YOUR_WALLET_ADDRESS', share: 100 }],
    };
  }

  return baseMetadata;
}

// ─── Main generation loop ──────────────────────────────────────────────────────

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
  outputFormat: string
) {
  isCancelled = false;

  const validLayers = layers.filter(l => l.traits.length > 0);
  if (validLayers.length === 0) {
    postMessage({ type: 'error', payload: { message: 'No valid layers found' } } as WorkerOutputMessage);
    return;
  }

  // Detect if any traits are animated GIFs
  let hasAnyAnimatedGif = false;
  if (outputFormat !== 'png') {
    for (const layer of validLayers) {
      for (const trait of layer.traits) {
        if (isGifDataUrl(trait.imageData)) {
          const parsed = parseGif(trait.imageData);
          if (parsed && parsed.isAnimated) {
            hasAnyAnimatedGif = true;
            break;
          }
        }
      }
      if (hasAnyAnimatedGif) break;
    }
  }

  // Assign token numbers
  const allTokenNumbers: number[] = [];
  for (let i = 1; i <= collectionSize; i++) allTokenNumbers.push(i);
  const shuffledNumbers = [...allTokenNumbers].sort(() => Math.random() - 0.5);

  // Process forged tokens
  const forgedNFTs: GeneratedNFTData[] = forgedTokens.map((token, index) => {
    const newTokenNumber = shuffledNumbers[index];
    const fileExtension = isGifDataUrl(token.imageData) ? 'gif' : 'png';
    const metadata = {
      name: `${projectName} #${newTokenNumber}`,
      description: `${projectName} - Custom 1-of-1`,
      image: `${newTokenNumber}.${fileExtension}`,
      attributes: [{ trait_type: 'Type', value: '1-of-1' }],
    };
    if (blockchain === 'SOL') {
      Object.assign(metadata, { symbol, seller_fee_basis_points: 500, creators: [{ address: 'YOUR_WALLET_ADDRESS', share: 100 }] });
    }
    return {
      id: newTokenNumber,
      dna: `forged-${token.id}`,
      imageData: token.imageData,
      metadata,
      isForged: true,
      forgedTokenId: token.id,
      outputFormat: fileExtension,
    };
  });

  if (forgedNFTs.length > 0) {
    postMessage({ type: 'batch', payload: { nfts: forgedNFTs, supportsImageCompositing } } as WorkerOutputMessage);
    postMessage({ type: 'progress', payload: { generatedCount: forgedNFTs.length, totalCount: collectionSize, percentage: (forgedNFTs.length / collectionSize) * 100 } } as WorkerOutputMessage);
  }

  const usedTokenNumbers = new Set(forgedNFTs.map(t => t.id));
  const availableNumbers = shuffledNumbers.filter(num => !usedTokenNumbers.has(num));
  const usedDNAs = new Set<string>(forgedNFTs.map(t => t.dna));

  let attempts = 0;
  const maxAttempts = collectionSize * 100;
  let availableIndex = 0;
  let currentBatch: GeneratedNFTData[] = [];
  let totalGenerated = forgedNFTs.length;

  while (totalGenerated < collectionSize && attempts < maxAttempts && availableIndex < availableNumbers.length) {
    if (isCancelled) {
      postMessage({ type: 'cancelAck' } as WorkerOutputMessage);
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
      const tokenNumber = availableNumbers[availableIndex++];

      // Determine if this NFT should be animated
      let imageData: string | null = null;
      let actualOutputFormat = 'png';

      if (hasAnyAnimatedGif || outputFormat === 'gif') {
        // Check if this specific NFT's selected traits include any animated GIFs
        let nftHasAnimatedGif = false;
        for (const layer of validLayers) {
          const traitId = selectedTraits[layer.id];
          if (!traitId) continue;
          const trait = layer.traits.find(t => t.id === traitId);
          if (trait && isGifDataUrl(trait.imageData)) {
            const parsed = parseGif(trait.imageData);
            if (parsed && parsed.isAnimated) {
              nftHasAnimatedGif = true;
              break;
            }
          }
        }

        if (nftHasAnimatedGif) {
          const result = await generateAnimatedGif(selectedTraits, validLayers, pixelArtMode);
          if (result) {
            imageData = result.dataUrl;
            actualOutputFormat = result.isGif ? 'gif' : 'png';
          }
        } else {
          imageData = await generateImage(selectedTraits, validLayers, pixelArtMode);
          actualOutputFormat = 'png';
        }
      } else {
        imageData = await generateImage(selectedTraits, validLayers, pixelArtMode);
        actualOutputFormat = 'png';
      }

      const metadata = createMetadata(tokenNumber, selectedTraits, layers, projectName, blockchain, symbol, actualOutputFormat);

      const nft: GeneratedNFTData = {
        id: tokenNumber,
        dna,
        imageData: imageData || undefined,
        metadata,
        isForged: false,
        selectedTraits: imageData ? undefined : selectedTraits,
        outputFormat: actualOutputFormat,
      };

      currentBatch.push(nft);
      totalGenerated++;

      postMessage({ type: 'progress', payload: { generatedCount: totalGenerated, totalCount: collectionSize, percentage: (totalGenerated / collectionSize) * 100 } } as WorkerOutputMessage);

      if (currentBatch.length >= batchSize) {
        postMessage({ type: 'batch', payload: { nfts: currentBatch, supportsImageCompositing } } as WorkerOutputMessage);
        currentBatch = [];
      }
    } catch {
      // skip this NFT
    }
  }

  if (currentBatch.length > 0) {
    postMessage({ type: 'batch', payload: { nfts: currentBatch, supportsImageCompositing } } as WorkerOutputMessage);
  }

  postMessage({ type: 'complete', payload: { totalGenerated } } as WorkerOutputMessage);
}

// ─── Message handler ───────────────────────────────────────────────────────────

self.onmessage = async (event: MessageEvent<WorkerInputMessage>) => {
  const message = event.data;

  if (message.type === 'start') {
    postMessage({ type: 'capability', payload: { supportsImageCompositing } } as WorkerOutputMessage);

    const { layers, rules, forgedTokens, collectionSize, projectName, blockchain, symbol, pixelArtMode, batchSize, outputFormat } = message.payload;

    await generateCollection(
      layers, rules, forgedTokens, collectionSize, projectName, blockchain, symbol, pixelArtMode, batchSize, outputFormat || 'png'
    );
  } else if (message.type === 'cancel') {
    isCancelled = true;
  }
};
