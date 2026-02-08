import { uploadDirectoryToPinata } from './pinata';
import type { GeneratedNFT, ProjectSettings } from '../App';
import { buildMetadataForNFT } from './metadataPresets';

export interface IPFSUploadProgress {
  current: number;
  total: number;
  percentage: number;
  stage: 'images' | 'metadata';
}

export interface IPFSUploadResult {
  success: boolean;
  imageDirCID?: string;
  metadataCID?: string;
  error?: string;
}

/**
 * Uploads all NFT images and metadata to IPFS via Pinata following industry standard workflow:
 * 1. Upload images as directory (1.png, 2.png, 3.png...) → get IMAGES_FOLDER_CID
 * 2. Build metadata with ipfs://IMAGES_FOLDER_CID/<TOKEN_ID>.png
 * 3. Upload metadata as directory (1.json, 2.json, 3.json...) → get METADATA_FOLDER_CID
 * Final token URI: ipfs://METADATA_FOLDER_CID/<TOKEN_ID>.json
 */
export async function uploadCollectionToIPFS(
  apiKey: string,
  nfts: GeneratedNFT[],
  projectName: string,
  symbol: string,
  settings: ProjectSettings,
  onProgress?: (progress: IPFSUploadProgress) => void
): Promise<IPFSUploadResult> {
  try {
    // Stage 1: Prepare all images for directory upload with 1-based sequential filenames
    const imageFiles: Array<{ filename: string; blob: Blob }> = [];
    
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: nfts.length,
          percentage: ((i + 1) / nfts.length) * 30, // First 30% for preparing images
          stage: 'images',
        });
      }

      // Convert base64 to blob
      const base64Data = nft.imageData.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }
      const imageBlob = new Blob([bytes], { type: 'image/png' });

      // Use 1-based sequential filenames: 1.png, 2.png, 3.png...
      const tokenId = i + 1;
      imageFiles.push({
        filename: `${tokenId}.png`,
        blob: imageBlob,
      });
    }

    // Upload all images as a directory
    if (onProgress) {
      onProgress({
        current: nfts.length,
        total: nfts.length,
        percentage: 40, // 40% for uploading images directory
        stage: 'images',
      });
    }

    const imageDirResult = await uploadDirectoryToPinata(
      apiKey,
      imageFiles,
      'collection-images'
    );

    if (!imageDirResult.success || !imageDirResult.cid) {
      return {
        success: false,
        error: imageDirResult.error || 'Image directory upload failed',
      };
    }

    const imageDirCID = imageDirResult.cid;

    // Stage 2: Build metadata with IPFS image URIs
    if (onProgress) {
      onProgress({
        current: 0,
        total: nfts.length,
        percentage: 50, // 50% starting metadata preparation
        stage: 'metadata',
      });
    }

    const metadataFiles: Array<{ filename: string; blob: Blob }> = [];

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: nfts.length,
          percentage: 50 + ((i + 1) / nfts.length) * 30, // 50-80% for preparing metadata
          stage: 'metadata',
        });
      }

      const attributes = nft.metadata.attributes as Array<{ trait_type: string; value: string }>;
      
      // Use 1-based token ID
      const tokenId = i + 1;
      
      // Build metadata with IPFS image URI (no subdirectory)
      const metadata = buildMetadataForNFT(
        projectName,
        symbol,
        settings,
        tokenId,
        attributes,
        imageDirCID,
        undefined // No subdirectory - images are at root of CID
      );

      // Convert metadata to JSON blob
      const metadataJson = JSON.stringify(metadata, null, 2);
      const metadataBlob = new Blob([metadataJson], { type: 'application/json' });

      // Use 1-based sequential filenames: 1.json, 2.json, 3.json...
      metadataFiles.push({
        filename: `${tokenId}.json`,
        blob: metadataBlob,
      });
    }

    // Stage 3: Upload metadata as a directory
    if (onProgress) {
      onProgress({
        current: nfts.length,
        total: nfts.length,
        percentage: 90, // 90% for uploading metadata directory
        stage: 'metadata',
      });
    }

    const metadataDirResult = await uploadDirectoryToPinata(
      apiKey,
      metadataFiles,
      'collection-metadata'
    );

    if (!metadataDirResult.success || !metadataDirResult.cid) {
      return {
        success: false,
        imageDirCID, // Return imageDirCID even if metadata fails
        error: metadataDirResult.error || 'Metadata directory upload failed',
      };
    }

    if (onProgress) {
      onProgress({
        current: nfts.length,
        total: nfts.length,
        percentage: 100,
        stage: 'metadata',
      });
    }

    return {
      success: true,
      imageDirCID,
      metadataCID: metadataDirResult.cid,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
