import type { ProjectSettings, MetadataFormat, SolanaCreator } from '../App';

/**
 * Resolves template placeholders in a string.
 * Supports {{collection}} and {{id}}.
 */
function resolveTemplate(
  template: string,
  collectionName: string,
  tokenId: number
): string {
  return template
    .replace(/\{\{collection\}\}/g, collectionName)
    .replace(/\{\{id\}\}/g, String(tokenId));
}

/**
 * Builds a metadata object for preview or export based on project settings.
 */
export function buildMetadataPreview(
  collectionName: string,
  symbol: string,
  settings: ProjectSettings,
  tokenId: number
): Record<string, unknown> {
  const actualTokenId = settings.startTokenNumberAtZero ? tokenId - 1 : tokenId;
  
  const name = resolveTemplate(settings.tokenNameTemplate, collectionName, actualTokenId);
  const description = settings.tokenDescription || `${collectionName} NFT Collection`;
  
  // Base image path (will be replaced with actual CID/path during export)
  const imagePath = `${actualTokenId}.png`;

  const baseMetadata: Record<string, unknown> = {
    name,
    description,
    image: imagePath,
    attributes: [
      {
        trait_type: 'Layer 1',
        value: '1.png',
      },
    ],
  };

  // Format-specific fields
  if (settings.metadataFormat === 'solana') {
    const creators = settings.solanaCreators && settings.solanaCreators.length > 0
      ? settings.solanaCreators.map(c => ({
          address: c.address || 'YOUR_WALLET_ADDRESS',
          share: c.share,
        }))
      : [{ address: 'YOUR_WALLET_ADDRESS', share: 100 }];

    return {
      ...baseMetadata,
      symbol,
      seller_fee_basis_points: Math.round(settings.royaltiesPercent * 100),
      properties: {
        files: [
          {
            uri: imagePath,
            type: 'image/png',
          },
        ],
        category: 'image',
        creators,
      },
    };
  }

  // ERC-721 standard (Ethereum, Polygon, Base, BNB Chain)
  if (settings.metadataFormat === 'ethereum' || 
      settings.metadataFormat === 'polygon' || 
      settings.metadataFormat === 'base' || 
      settings.metadataFormat === 'bnb') {
    return {
      ...baseMetadata,
    };
  }

  if (settings.metadataFormat === 'icp') {
    return {
      ...baseMetadata,
      symbol,
    };
  }

  return baseMetadata;
}

/**
 * Builds metadata for a specific NFT during generation or export.
 * Includes actual trait attributes.
 * If imageDirCID is provided, uses ipfs:// URIs; otherwise uses local filenames.
 */
export function buildMetadataForNFT(
  collectionName: string,
  symbol: string,
  settings: ProjectSettings,
  tokenId: number,
  attributes: Array<{ trait_type: string; value: string }>,
  imageDirCID?: string
): Record<string, unknown> {
  const actualTokenId = settings.startTokenNumberAtZero ? tokenId - 1 : tokenId;
  
  const name = resolveTemplate(settings.tokenNameTemplate, collectionName, actualTokenId);
  const description = settings.tokenDescription || `${collectionName} NFT Collection`;
  
  // Use IPFS URI if CID is provided, otherwise local filename
  const imagePath = imageDirCID 
    ? `ipfs://${imageDirCID}/${actualTokenId}.png`
    : `${actualTokenId}.png`;

  const baseMetadata: Record<string, unknown> = {
    name,
    description,
    image: imagePath,
    attributes,
  };

  if (settings.metadataFormat === 'solana') {
    const creators = settings.solanaCreators && settings.solanaCreators.length > 0
      ? settings.solanaCreators.map(c => ({
          address: c.address,
          share: c.share,
        }))
      : [{ address: 'YOUR_WALLET_ADDRESS', share: 100 }];

    return {
      ...baseMetadata,
      symbol,
      seller_fee_basis_points: Math.round(settings.royaltiesPercent * 100),
      properties: {
        files: [
          {
            uri: imagePath,
            type: 'image/png',
          },
        ],
        category: 'image',
        creators,
      },
    };
  }

  // ERC-721 standard (Ethereum, Polygon, Base, BNB Chain)
  if (settings.metadataFormat === 'ethereum' || 
      settings.metadataFormat === 'polygon' || 
      settings.metadataFormat === 'base' || 
      settings.metadataFormat === 'bnb') {
    return {
      ...baseMetadata,
    };
  }

  if (settings.metadataFormat === 'icp') {
    return {
      ...baseMetadata,
      symbol,
    };
  }

  return baseMetadata;
}
