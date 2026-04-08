import { c as createLucideIcon, j as jsxRuntimeExports, n as cn, a0 as cva } from "./index-pc9VbM7E.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$3 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
];
const CircleCheck = createLucideIcon("circle-check", __iconNode$3);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
  ["path", { d: "m9 9 6 6", key: "z0biqf" }]
];
const CircleX = createLucideIcon("circle-x", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]];
const LoaderCircle = createLucideIcon("loader-circle", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
const TriangleAlert = createLucideIcon("triangle-alert", __iconNode);
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Alert({
  className,
  variant,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "alert",
      role: "alert",
      className: cn(alertVariants({ variant }), className),
      ...props
    }
  );
}
function AlertDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "alert-description",
      className: cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      ),
      ...props
    }
  );
}
function resolveTemplate(template, collectionName, tokenId) {
  return template.replace(/\{\{collection\}\}/g, collectionName).replace(/\{\{id\}\}/g, String(tokenId));
}
function buildMetadataPreview(collectionName, symbol, settings, tokenId) {
  const actualTokenId = settings.startTokenNumberAtZero ? tokenId - 1 : tokenId;
  const name = resolveTemplate(
    settings.tokenNameTemplate,
    collectionName,
    actualTokenId
  );
  const description = settings.tokenDescription || `${collectionName} NFT Collection`;
  const imagePath = `${actualTokenId}.png`;
  const baseMetadata = {
    name,
    description,
    image: imagePath,
    attributes: [
      {
        trait_type: "Layer 1",
        value: "1.png"
      }
    ]
  };
  if (settings.metadataFormat === "solana") {
    const creators = settings.solanaCreators && settings.solanaCreators.length > 0 ? settings.solanaCreators.map((c) => ({
      address: c.address || "YOUR_WALLET_ADDRESS",
      share: c.share
    })) : [{ address: "YOUR_WALLET_ADDRESS", share: 100 }];
    return {
      ...baseMetadata,
      symbol,
      seller_fee_basis_points: Math.round(settings.royaltiesPercent * 100),
      properties: {
        files: [
          {
            uri: imagePath,
            type: "image/png"
          }
        ],
        category: "image",
        creators
      }
    };
  }
  if (settings.metadataFormat === "ethereum" || settings.metadataFormat === "polygon" || settings.metadataFormat === "base" || settings.metadataFormat === "bnb") {
    return {
      ...baseMetadata
    };
  }
  if (settings.metadataFormat === "icp") {
    return {
      ...baseMetadata,
      symbol
    };
  }
  return baseMetadata;
}
function buildMetadataForNFT(collectionName, symbol, settings, tokenId, attributes, imageDirCID) {
  const actualTokenId = settings.startTokenNumberAtZero ? tokenId - 1 : tokenId;
  const name = resolveTemplate(
    settings.tokenNameTemplate,
    collectionName,
    actualTokenId
  );
  const description = settings.tokenDescription || `${collectionName} NFT Collection`;
  const imagePath = imageDirCID ? `ipfs://${imageDirCID}/${actualTokenId}.png` : `${actualTokenId}.png`;
  const baseMetadata = {
    name,
    description,
    image: imagePath,
    attributes
  };
  if (settings.metadataFormat === "solana") {
    const creators = settings.solanaCreators && settings.solanaCreators.length > 0 ? settings.solanaCreators.map((c) => ({
      address: c.address,
      share: c.share
    })) : [{ address: "YOUR_WALLET_ADDRESS", share: 100 }];
    return {
      ...baseMetadata,
      symbol,
      seller_fee_basis_points: Math.round(settings.royaltiesPercent * 100),
      properties: {
        files: [
          {
            uri: imagePath,
            type: "image/png"
          }
        ],
        category: "image",
        creators
      }
    };
  }
  if (settings.metadataFormat === "ethereum" || settings.metadataFormat === "polygon" || settings.metadataFormat === "base" || settings.metadataFormat === "bnb") {
    return {
      ...baseMetadata
    };
  }
  if (settings.metadataFormat === "icp") {
    return {
      ...baseMetadata,
      symbol
    };
  }
  return baseMetadata;
}
async function validatePinataKey(apiKey) {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      valid: false,
      message: "Please enter your JWT token"
    };
  }
  try {
    const response = await fetch(
      "https://api.pinata.cloud/data/testAuthentication",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );
    if (response.ok) {
      return {
        valid: true,
        message: "JWT token is valid"
      };
    }
    if (response.status === 401) {
      return {
        valid: false,
        message: "This JWT token is not valid"
      };
    }
    return {
      valid: false,
      message: "Could not validate JWT token"
    };
  } catch (_error) {
    return {
      valid: false,
      message: "Could not connect to Pinata"
    };
  }
}
function sanitizeFilename(filename) {
  let sanitized = filename.replace(/^[A-Za-z]:\\/, "");
  sanitized = sanitized.replace(/^\/[^/]+\//, "");
  sanitized = sanitized.replace(/^\.\//, "");
  sanitized = sanitized.replace(/^\.\.\//, "");
  sanitized = sanitized.replace(/\\/g, "/");
  const parts = sanitized.split("/");
  return parts[parts.length - 1];
}
async function uploadDirectoryToPinata(apiKey, files, folderPrefix) {
  try {
    const formData = new FormData();
    for (const { filename, blob } of files) {
      const sanitizedBasename = sanitizeFilename(filename);
      const relativePath = `${folderPrefix}/${sanitizedBasename}`;
      formData.append("file", blob, relativePath);
    }
    const metadata = JSON.stringify({
      name: `${folderPrefix}-directory`
    });
    formData.append("pinataMetadata", metadata);
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: formData
      }
    );
    if (!response.ok) {
      return {
        success: false,
        error: `Directory upload failed: ${response.status}`
      };
    }
    const data = await response.json();
    return {
      success: true,
      cid: data.IpfsHash
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Directory upload failed"
    };
  }
}
export {
  Alert as A,
  CircleCheck as C,
  LoaderCircle as L,
  TriangleAlert as T,
  AlertDescription as a,
  buildMetadataForNFT as b,
  CircleX as c,
  buildMetadataPreview as d,
  uploadDirectoryToPinata as u,
  validatePinataKey as v
};
