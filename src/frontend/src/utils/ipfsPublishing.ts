import { uploadDirectoryToPinata, uploadJSONToPinata } from './pinata';
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
 * Uploads all NFT images and metadata to IPFS via Pinata
 * Images are uploaded as a directory to get a single CID for ipfs://<cid>/images/<tokenId>.png URIs
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
          percentage: ((i + 1) / nfts.length) * 40, // First 40% for preparing images
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

      const actualTokenId = settings.startTokenNumberAtZero ? nft.id - 1 : nft.id;
      imageFiles.push({
        filename: `${actualTokenId}.png`,
        blob: imageBlob,
      });
    }

    // Upload all images as a directory
    if (onProgress) {
      onProgress({
        current: nfts.length,
        total: nfts.length,
        percentage: 50, // 50% for uploading directory
        stage: 'images',
      });
    }

    const imageDirResult = await uploadDirectoryToPinata(apiKey, imageFiles);

    if (!imageDirResult.success || !imageDirResult.cid) {
      return {
        success: false,
        error: imageDirResult.error || 'Image directory upload failed',
      };
    }

    const imageDirCID = imageDirResult.cid;

    // Stage 2: Build and upload metadata with IPFS URIs
    // The directory structure is: <CID>/images/<filename>
    const metadataArray: any[] = [];

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: nfts.length,
          percentage: 50 + ((i + 1) / nfts.length) * 50, // Second 50% for metadata
          stage: 'metadata',
        });
      }

      const attributes = nft.metadata.attributes as Array<{ trait_type: string; value: string }>;
      
      // Build metadata with IPFS image URI
      // Pass the directory CID and the subdirectory name ('images')
      const metadata = buildMetadataForNFT(
        projectName,
        symbol,
        settings,
        nft.id,
        attributes,
        imageDirCID,
        'images' // subdirectory name
      );

      metadataArray.push(metadata);
    }

    // Upload master metadata JSON
    const metadataResult = await uploadJSONToPinata(
      apiKey,
      metadataArray,
      `${projectName.replace(/\s+/g, '_')}_metadata.json`
    );

    if (!metadataResult.success || !metadataResult.cid) {
      return {
        success: false,
        imageDirCID, // Return imageDirCID even if metadata fails
        error: metadataResult.error || 'Metadata upload failed',
      };
    }

    return {
      success: true,
      imageDirCID,
      metadataCID: metadataResult.cid,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
