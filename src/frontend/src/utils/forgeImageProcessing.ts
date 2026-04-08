/**
 * Process uploaded images for Forge Direct Injection
 * Converts any uploaded image to a square PNG at the configured output size
 * with optional pixel-mode rendering
 */

export interface ProcessImageOptions {
  outputSize: number;
  pixelArtMode: boolean;
}

/**
 * Process an uploaded image data URL into a square PNG at the specified dimensions
 * Uses cover strategy (scale and crop) to maintain aspect ratio without distortion
 */
export async function processForgeImage(
  imageDataUrl: string,
  options: ProcessImageOptions,
): Promise<string> {
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

        // Set canvas to square output size
        canvas.width = options.outputSize;
        canvas.height = options.outputSize;

        // Disable image smoothing for pixel art mode
        if (options.pixelArtMode) {
          ctx.imageSmoothingEnabled = false;
        }

        // Calculate scale and crop to fit square (cover strategy)
        const scale = Math.max(
          canvas.width / img.width,
          canvas.height / img.height,
        );

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;

        // Draw the image scaled and centered
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          offsetX,
          offsetY,
          scaledWidth,
          scaledHeight,
        );

        // Convert to PNG data URL
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
