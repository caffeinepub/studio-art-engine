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
 * Uploads all NFT images and metadata to IPFS via Pinata.
 * Follows industry-standard workflow:
 * 1. Upload images as a directory (images/1.png, images/2.png, etc.) -> get IMAGES_FOLDER_CID
 * 2. Generate metadata JSON files with image field as ipfs://IMAGES_FOLDER_CID/<TOKEN_ID>.<ext>
 * 3. Upload metadata as a directory (metadata/1.json, metadata/2.json, etc.) -> get METADATA_FOLDER_CID
 * Supports both PNG and GIF formats.
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
    // Stage 1: Prepare all images for directory upload
    const imageFiles: Array<{ filename: string; blob: Blob }> = [];

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: nfts.length,
          percentage: ((i + 1) / nfts.length) * 30,
          stage: 'images',
        });
      }

      // Detect image format from data URL
      let mimeType = 'image/png';
      let fileExtension = 'png';

      if (nft.imageData.startsWith('data:image/gif')) {
        mimeType = 'image/gif';
        fileExtension = 'gif';
      } else if (nft.imageData.startsWith('data:image/png')) {
        mimeType = 'image/png';
        fileExtension = 'png';
      }

      // Convert base64 to blob
      const base64Data = nft.imageData.split(',')[1];
      if (!base64Data) continue;

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }
      const imageBlob = new Blob([bytes], { type: mimeType });

      const actualTokenId = settings.startTokenNumberAtZero ? nft.id - 1 : nft.id;
      imageFiles.push({
        filename: `${actualTokenId}.${fileExtension}`,
        blob: imageBlob,
      });
    }

    // Upload all images as a directory with "images" folder prefix
    if (onProgress) {
      onProgress({
        current: nfts.length,
        total: nfts.length,
        percentage: 40,
        stage: 'images',
      });
    }

    const imageDirResult = await uploadDirectoryToPinata(apiKey, imageFiles, 'images');

    if (!imageDirResult.success || !imageDirResult.cid) {
      return {
        success: false,
        error: imageDirResult.error || 'Image directory upload failed',
      };
    }

    const imageDirCID = imageDirResult.cid;

    // Stage 2: Build metadata JSON files with IPFS URIs
    const metadataFiles: Array<{ filename: string; blob: Blob }> = [];

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: nfts.length,
          percentage: 40 + ((i + 1) / nfts.length) * 30,
          stage: 'metadata',
        });
      }

      const attributes = nft.metadata.attributes as Array<{ trait_type: string; value: string }>;

      // Detect file extension for this NFT
      const fileExtension = nft.imageData.startsWith('data:image/gif') ? 'gif' : 'png';

      // Build metadata with IPFS image URI
      const metadata = buildMetadataForNFT(
        projectName,
        symbol,
        settings,
        nft.id,
        attributes,
        imageDirCID,
        fileExtension
      );

      const actualTokenId = settings.startTokenNumberAtZero ? nft.id - 1 : nft.id;
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });

      metadataFiles.push({
        filename: `${actualTokenId}.json`,
        blob: metadataBlob,
      });
    }

    // Upload all metadata as a directory
    if (onProgress) {
      onProgress({
        current: nfts.length,
        total: nfts.length,
        percentage: 80,
        stage: 'metadata',
      });
    }

    const metadataDirResult = await uploadDirectoryToPinata(apiKey, metadataFiles, 'metadata');

    if (!metadataDirResult.success || !metadataDirResult.cid) {
      return {
        success: false,
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
