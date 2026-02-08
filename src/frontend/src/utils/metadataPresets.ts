import type { Project, ProjectSettings } from '../App';

/**
 * Builds metadata for a single NFT based on the project's blockchain format
 * @param projectName - Name of the project
 * @param symbol - Symbol/ticker for the collection
 * @param settings - Project settings including blockchain and metadata format
 * @param tokenId - Token ID (1-based)
 * @param attributes - Array of trait attributes
 * @param ipfsCID - IPFS CID for the image (optional)
 * @param subdirectory - Subdirectory path within the CID (optional, e.g., 'images')
 */
export function buildMetadataForNFT(
  projectName: string,
  symbol: string,
  settings: ProjectSettings,
  tokenId: number,
  attributes: Array<{ trait_type: string; value: string }>,
  ipfsCID?: string,
  subdirectory?: string
): any {
  // Construct image URI
  let imageUri: string;
  if (ipfsCID) {
    // If subdirectory is provided, include it in the path
    if (subdirectory) {
      imageUri = `ipfs://${ipfsCID}/${subdirectory}/${tokenId}.png`;
    } else {
      // No subdirectory - image is at root of CID
      imageUri = `ipfs://${ipfsCID}/${tokenId}.png`;
    }
  } else {
    // Fallback for preview/export without IPFS
    imageUri = `${tokenId}.png`;
  }

  // Base metadata structure (ERC-721 standard)
  const baseMetadata = {
    name: `${projectName} #${tokenId}`,
    description: `${projectName} NFT Collection`,
    image: imageUri,
    attributes,
  };

  // Solana (Metaplex) format
  if (settings.metadataFormat === 'solana') {
    return {
      ...baseMetadata,
      symbol: symbol,
      seller_fee_basis_points: (settings.solanaCreators && settings.solanaCreators.length > 0) ? 500 : 500,
      external_url: '',
      properties: {
        files: [
          {
            uri: imageUri,
            type: 'image/png',
          },
        ],
        category: 'image',
        creators: settings.solanaCreators || [
          {
            address: 'YOUR_WALLET_ADDRESS',
            share: 100,
          },
        ],
      },
    };
  }

  // ERC-721 standard (Ethereum, Polygon, Base, BNB Chain)
  return baseMetadata;
}

/**
 * Builds preview metadata for display in the UI
 */
export function buildMetadataPreview(
  project: Project,
  tokenId: number,
  attributes: Array<{ trait_type: string; value: string }>
): any {
  return buildMetadataForNFT(
    project.name,
    project.symbol,
    project.settings,
    tokenId,
    attributes
  );
}
