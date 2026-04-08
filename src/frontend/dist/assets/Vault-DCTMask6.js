var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, n as cn, x as useConfirmDestructive, B as Button, u as ue, g as useControllableState, P as Primitive, y as useId, h as composeEventHandlers, z as Presence, l as createContextScope$1, i as useComposedRefs, C as useLayoutEffect2, R as React, E as Primitive$1, F as FilterIcon, G as SearchIcon, I as Input, H as DownloadIcon, S as Switch, L as Label, J as XIcon, K as RefreshCwIcon } from "./index-pc9VbM7E.js";
import { u as uploadDirectoryToPinata, b as buildMetadataForNFT, A as Alert, a as AlertDescription, L as LoaderCircle, T as TriangleAlert, C as CircleCheck, c as CircleX } from "./pinata-L-R8UZ9G.js";
import { L as Lock, a as LockOpen } from "./lock-DXs5Sw2E.js";
import { c as createCollection } from "./index-BHuraKdI.js";
import { u as useDirection, S as ScrollArea } from "./scroll-area-D32bQ35H.js";
import { C as ChevronDown } from "./chevron-down-D7GD2-2C.js";
import { C as Card, c as CardContent } from "./card-ao4MF0GX.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "M12 3v18", key: "108xh3" }],
  ["path", { d: "M3 12h18", key: "1i2n21" }],
  ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", key: "h1oib" }]
];
const Grid2x2 = createLucideIcon("grid-2x2", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "1g98yp" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "6d4xhi" }],
  ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1", key: "nxv5o0" }],
  ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1", key: "1bb6yr" }]
];
const LayoutGrid = createLucideIcon("layout-grid", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M12 3v12", key: "1x0j5s" }],
  ["path", { d: "m17 8-5-5-5 5", key: "7q97r8" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }]
];
const Upload = createLucideIcon("upload", __iconNode);
const MotionIconButton = reactExports.forwardRef(
  ({ className, children, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        ref,
        type: "button",
        className: cn(
          "motion-icon-button inline-flex items-center justify-center",
          "transition-all duration-hover ease-apple",
          "hover:scale-110",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        ),
        ...props,
        children
      }
    );
  }
);
MotionIconButton.displayName = "MotionIconButton";
async function uploadCollectionToIPFS(apiKey, nfts, projectName, symbol, settings, onProgress) {
  try {
    const imageFiles = [];
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: nfts.length,
          percentage: (i + 1) / nfts.length * 30,
          // First 30% for preparing images
          stage: "images"
        });
      }
      if (!nft.imageData.startsWith("data:image/png")) {
        console.warn(
          `NFT #${nft.id} imageData is not a PNG data URL, may be unprocessed`
        );
      }
      const base64Data = nft.imageData.split(",")[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }
      const imageBlob = new Blob([bytes], { type: "image/png" });
      const actualTokenId = settings.startTokenNumberAtZero ? nft.id - 1 : nft.id;
      imageFiles.push({
        filename: `${actualTokenId}.png`,
        blob: imageBlob
      });
    }
    if (onProgress) {
      onProgress({
        current: nfts.length,
        total: nfts.length,
        percentage: 40,
        // 40% for uploading images directory
        stage: "images"
      });
    }
    const imageDirResult = await uploadDirectoryToPinata(
      apiKey,
      imageFiles,
      "images"
    );
    if (!imageDirResult.success || !imageDirResult.cid) {
      return {
        success: false,
        error: imageDirResult.error || "Image directory upload failed"
      };
    }
    const imageDirCID = imageDirResult.cid;
    const metadataFiles = [];
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: nfts.length,
          percentage: 40 + (i + 1) / nfts.length * 30,
          // 30% for preparing metadata
          stage: "metadata"
        });
      }
      const attributes = nft.metadata.attributes;
      const metadata = buildMetadataForNFT(
        projectName,
        symbol,
        settings,
        nft.id,
        attributes,
        imageDirCID
        // Pass CID to generate ipfs:// URIs
      );
      const actualTokenId = settings.startTokenNumberAtZero ? nft.id - 1 : nft.id;
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json"
      });
      metadataFiles.push({
        filename: `${actualTokenId}.json`,
        blob: metadataBlob
      });
    }
    if (onProgress) {
      onProgress({
        current: nfts.length,
        total: nfts.length,
        percentage: 80,
        // 80% for uploading metadata directory
        stage: "metadata"
      });
    }
    const metadataDirResult = await uploadDirectoryToPinata(
      apiKey,
      metadataFiles,
      "metadata"
    );
    if (!metadataDirResult.success || !metadataDirResult.cid) {
      return {
        success: false,
        error: metadataDirResult.error || "Metadata directory upload failed"
      };
    }
    if (onProgress) {
      onProgress({
        current: nfts.length,
        total: nfts.length,
        percentage: 100,
        stage: "metadata"
      });
    }
    return {
      success: true,
      imageDirCID,
      metadataCID: metadataDirResult.cid
      // This is now the metadata folder CID
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed"
    };
  }
}
function HoverTooltip({ content, children }) {
  const [isVisible, setIsVisible] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "relative inline-block",
      onMouseEnter: () => setIsVisible(true),
      onMouseLeave: () => setIsVisible(false),
      onFocus: () => setIsVisible(true),
      onBlur: () => setIsVisible(false),
      children: [
        children,
        isVisible && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border border-border whitespace-nowrap z-50 pointer-events-none transition-all duration-component ease-apple animate-fade-in-scale",
            role: "tooltip",
            children: [
              content,
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-popover border-r border-b border-border rotate-45" })
            ]
          }
        )
      ]
    }
  );
}
function VaultPublishingControls({
  project,
  onUpdateProject
}) {
  const [_isUploading, setIsUploading] = reactExports.useState(false);
  const { confirm } = useConfirmDestructive();
  const hasGenerated = project.generatedNFTs.length > 0;
  const hasValidKey = project.settings.pinataApiKey && project.settings.pinataApiKey.trim().length > 0;
  const isLocked = project.collectionLocked || false;
  const publishingState = project.ipfsPublishing;
  const isCurrentlyUploading = (publishingState == null ? void 0 : publishingState.status) === "uploading";
  const hasUploaded = (publishingState == null ? void 0 : publishingState.status) === "uploaded";
  const hasFailed = (publishingState == null ? void 0 : publishingState.status) === "upload-failed";
  const canLock = hasGenerated && !isLocked && !hasUploaded;
  const canUnlock = isLocked || hasUploaded;
  const canUpload = hasGenerated && hasValidKey && isLocked && !isCurrentlyUploading && !hasUploaded;
  const canRetry = hasGenerated && hasValidKey && hasFailed;
  const handleLock = () => {
    onUpdateProject((p) => ({
      ...p,
      collectionLocked: true,
      ipfsPublishing: {
        ...p.ipfsPublishing,
        status: "ready-to-upload"
      }
    }));
    ue.success("Collection locked and ready to upload");
  };
  const handleUnlock = async () => {
    const confirmed = await confirm({
      title: "Unlock collection?",
      description: hasUploaded ? "Unlocking will allow you to regenerate the collection, but you will need to re-upload to IPFS." : "Unlocking will allow you to regenerate the collection. You can lock it again when ready."
    });
    if (confirmed) {
      onUpdateProject((p) => ({
        ...p,
        collectionLocked: false,
        ipfsPublishing: {
          status: "ready",
          uploadProgress: void 0,
          errorMessage: void 0,
          imageDirCID: void 0,
          metadataCID: void 0
        }
      }));
      ue.success("Collection unlocked");
    }
  };
  const handleUpload = async () => {
    if (!project.settings.pinataApiKey) {
      ue.error("Pinata JWT token is required");
      return;
    }
    setIsUploading(true);
    onUpdateProject((p) => ({
      ...p,
      ipfsPublishing: {
        ...p.ipfsPublishing,
        status: "uploading",
        uploadProgress: 0,
        errorMessage: void 0
      }
    }));
    try {
      const result = await uploadCollectionToIPFS(
        project.settings.pinataApiKey,
        project.generatedNFTs,
        project.name,
        project.symbol,
        project.settings,
        (progress) => {
          onUpdateProject((p) => ({
            ...p,
            ipfsPublishing: {
              ...p.ipfsPublishing,
              status: "uploading",
              uploadProgress: Math.round(progress.percentage)
            }
          }));
        }
      );
      if (result.success) {
        onUpdateProject((p) => ({
          ...p,
          ipfsPublishing: {
            status: "uploaded",
            uploadProgress: 100,
            errorMessage: void 0,
            imageDirCID: result.imageDirCID,
            metadataCID: result.metadataCID
          }
        }));
        ue.success("Collection uploaded to IPFS successfully!");
      } else {
        onUpdateProject((p) => ({
          ...p,
          ipfsPublishing: {
            ...p.ipfsPublishing,
            status: "upload-failed",
            errorMessage: result.error || "Upload failed"
          }
        }));
        ue.error(result.error || "Upload failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      onUpdateProject((p) => ({
        ...p,
        ipfsPublishing: {
          ...p.ipfsPublishing,
          status: "upload-failed",
          errorMessage
        }
      }));
      ue.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };
  const getStatusMessage = () => {
    if (!hasGenerated) {
      return {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5 text-amber-500" }),
        text: "Generate your collection first",
        color: "text-amber-600 dark:text-amber-400"
      };
    }
    if (!hasValidKey) {
      return {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5 text-amber-500" }),
        text: "Add your Pinata JWT token in Settings",
        color: "text-amber-600 dark:text-amber-400"
      };
    }
    if (hasUploaded) {
      return {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-green-500" }),
        text: `Uploaded successfully! Metadata folder CID: ${(publishingState == null ? void 0 : publishingState.metadataCID) || "N/A"}`,
        color: "text-green-600 dark:text-green-400"
      };
    }
    if (isCurrentlyUploading) {
      return {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin text-blue-500" }),
        text: `Uploading to IPFS... ${(publishingState == null ? void 0 : publishingState.uploadProgress) || 0}%`,
        color: "text-blue-600 dark:text-blue-400"
      };
    }
    if (hasFailed) {
      return {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5 text-red-500" }),
        text: `Upload failed: ${(publishingState == null ? void 0 : publishingState.errorMessage) || "Unknown error"}`,
        color: "text-red-600 dark:text-red-400"
      };
    }
    if (isLocked) {
      return {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-green-500" }),
        text: "Collection locked and ready to upload",
        color: "text-green-600 dark:text-green-400"
      };
    }
    return {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5 text-blue-500" }),
      text: "Lock your collection to enable upload",
      color: "text-blue-600 dark:text-blue-400"
    };
  };
  const statusMessage = getStatusMessage();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { className: "border py-2 px-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: isCurrentlyUploading ? "loading-pulse" : "", children: statusMessage.icon }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `text-xs font-medium ${statusMessage.color} ${isLocked && !isCurrentlyUploading && !hasUploaded ? "loading-pulse" : ""}`,
          children: statusMessage.text
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(HoverTooltip, { content: "Prevents regeneration and enables upload.", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleLock,
          disabled: !canLock,
          variant: isLocked ? "outline" : "default",
          size: "sm",
          className: "motion-button motion-press-snappy h-9 px-4 font-semibold text-xs focus-ring",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-3.5 h-3.5 mr-1.5" }),
            "Lock"
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(HoverTooltip, { content: "Allows regeneration but clears upload status.", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleUnlock,
          disabled: !canUnlock,
          variant: "outline",
          size: "sm",
          className: "motion-button motion-press-snappy h-9 px-4 font-semibold text-xs focus-ring",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LockOpen, { className: "w-3.5 h-3.5 mr-1.5" }),
            "Unlock"
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(HoverTooltip, { content: "Uploads images and metadata folders to IPFS via Pinata.", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: handleUpload,
          disabled: !canUpload && !canRetry,
          variant: canUpload || canRetry ? "default" : "outline",
          size: "sm",
          className: "motion-button motion-press-snappy h-9 px-4 font-semibold text-xs focus-ring",
          children: isCurrentlyUploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3.5 h-3.5 mr-1.5 animate-spin" }),
            "Uploading..."
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-3.5 h-3.5 mr-1.5" }),
            canRetry ? "Retry Upload" : "Upload"
          ] })
        }
      ) })
    ] })
  ] });
}
function VaultViewModeToggle({
  viewMode,
  onViewModeChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-0.5 p-0.5 bg-muted/30 rounded-lg border border-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: () => onViewModeChange("compact"),
        className: `h-8 px-3 font-semibold text-[10px] uppercase tracking-wider transition-all duration-component ease-apple ${viewMode === "compact" ? "bg-background text-foreground shadow-sm scale-100" : "text-muted-foreground hover:text-foreground hover:bg-transparent scale-95"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Grid2x2, { className: "w-3.5 h-3.5 mr-1.5" }),
          "Compact"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: () => onViewModeChange("grid"),
        className: `h-8 px-3 font-semibold text-[10px] uppercase tracking-wider transition-all duration-component ease-apple ${viewMode === "grid" ? "bg-background text-foreground shadow-sm scale-100" : "text-muted-foreground hover:text-foreground hover:bg-transparent scale-95"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "w-3.5 h-3.5 mr-1.5" }),
          "Grid"
        ]
      }
    )
  ] });
}
var COLLAPSIBLE_NAME = "Collapsible";
var [createCollapsibleContext, createCollapsibleScope] = createContextScope$1(COLLAPSIBLE_NAME);
var [CollapsibleProvider, useCollapsibleContext] = createCollapsibleContext(COLLAPSIBLE_NAME);
var Collapsible = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeCollapsible,
      open: openProp,
      defaultOpen,
      disabled,
      onOpenChange,
      ...collapsibleProps
    } = props;
    const [open, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen ?? false,
      onChange: onOpenChange,
      caller: COLLAPSIBLE_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      CollapsibleProvider,
      {
        scope: __scopeCollapsible,
        disabled,
        contentId: useId(),
        open,
        onOpenToggle: reactExports.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            "data-state": getState$1(open),
            "data-disabled": disabled ? "" : void 0,
            ...collapsibleProps,
            ref: forwardedRef
          }
        )
      }
    );
  }
);
Collapsible.displayName = COLLAPSIBLE_NAME;
var TRIGGER_NAME$1 = "CollapsibleTrigger";
var CollapsibleTrigger = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeCollapsible, ...triggerProps } = props;
    const context = useCollapsibleContext(TRIGGER_NAME$1, __scopeCollapsible);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.button,
      {
        type: "button",
        "aria-controls": context.contentId,
        "aria-expanded": context.open || false,
        "data-state": getState$1(context.open),
        "data-disabled": context.disabled ? "" : void 0,
        disabled: context.disabled,
        ...triggerProps,
        ref: forwardedRef,
        onClick: composeEventHandlers(props.onClick, context.onOpenToggle)
      }
    );
  }
);
CollapsibleTrigger.displayName = TRIGGER_NAME$1;
var CONTENT_NAME$1 = "CollapsibleContent";
var CollapsibleContent = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { forceMount, ...contentProps } = props;
    const context = useCollapsibleContext(CONTENT_NAME$1, props.__scopeCollapsible);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || context.open, children: ({ present }) => /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContentImpl, { ...contentProps, ref: forwardedRef, present }) });
  }
);
CollapsibleContent.displayName = CONTENT_NAME$1;
var CollapsibleContentImpl = reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeCollapsible, present, children, ...contentProps } = props;
  const context = useCollapsibleContext(CONTENT_NAME$1, __scopeCollapsible);
  const [isPresent, setIsPresent] = reactExports.useState(present);
  const ref = reactExports.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  const heightRef = reactExports.useRef(0);
  const height = heightRef.current;
  const widthRef = reactExports.useRef(0);
  const width = widthRef.current;
  const isOpen = context.open || isPresent;
  const isMountAnimationPreventedRef = reactExports.useRef(isOpen);
  const originalStylesRef = reactExports.useRef(void 0);
  reactExports.useEffect(() => {
    const rAF = requestAnimationFrame(() => isMountAnimationPreventedRef.current = false);
    return () => cancelAnimationFrame(rAF);
  }, []);
  useLayoutEffect2(() => {
    const node = ref.current;
    if (node) {
      originalStylesRef.current = originalStylesRef.current || {
        transitionDuration: node.style.transitionDuration,
        animationName: node.style.animationName
      };
      node.style.transitionDuration = "0s";
      node.style.animationName = "none";
      const rect = node.getBoundingClientRect();
      heightRef.current = rect.height;
      widthRef.current = rect.width;
      if (!isMountAnimationPreventedRef.current) {
        node.style.transitionDuration = originalStylesRef.current.transitionDuration;
        node.style.animationName = originalStylesRef.current.animationName;
      }
      setIsPresent(present);
    }
  }, [context.open, present]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Primitive.div,
    {
      "data-state": getState$1(context.open),
      "data-disabled": context.disabled ? "" : void 0,
      id: context.contentId,
      hidden: !isOpen,
      ...contentProps,
      ref: composedRefs,
      style: {
        [`--radix-collapsible-content-height`]: height ? `${height}px` : void 0,
        [`--radix-collapsible-content-width`]: width ? `${width}px` : void 0,
        ...props.style
      },
      children: isOpen && children
    }
  );
});
function getState$1(open) {
  return open ? "open" : "closed";
}
var Root$1 = Collapsible;
var Trigger = CollapsibleTrigger;
var Content = CollapsibleContent;
var ACCORDION_NAME = "Accordion";
var ACCORDION_KEYS = ["Home", "End", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
var [Collection, useCollection, createCollectionScope] = createCollection(ACCORDION_NAME);
var [createAccordionContext] = createContextScope$1(ACCORDION_NAME, [
  createCollectionScope,
  createCollapsibleScope
]);
var useCollapsibleScope = createCollapsibleScope();
var Accordion$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { type, ...accordionProps } = props;
    const singleProps = accordionProps;
    const multipleProps = accordionProps;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Provider, { scope: props.__scopeAccordion, children: type === "multiple" ? /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImplMultiple, { ...multipleProps, ref: forwardedRef }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImplSingle, { ...singleProps, ref: forwardedRef }) });
  }
);
Accordion$1.displayName = ACCORDION_NAME;
var [AccordionValueProvider, useAccordionValueContext] = createAccordionContext(ACCORDION_NAME);
var [AccordionCollapsibleProvider, useAccordionCollapsibleContext] = createAccordionContext(
  ACCORDION_NAME,
  { collapsible: false }
);
var AccordionImplSingle = React.forwardRef(
  (props, forwardedRef) => {
    const {
      value: valueProp,
      defaultValue,
      onValueChange = () => {
      },
      collapsible = false,
      ...accordionSingleProps
    } = props;
    const [value, setValue] = useControllableState({
      prop: valueProp,
      defaultProp: defaultValue ?? "",
      onChange: onValueChange,
      caller: ACCORDION_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AccordionValueProvider,
      {
        scope: props.__scopeAccordion,
        value: React.useMemo(() => value ? [value] : [], [value]),
        onItemOpen: setValue,
        onItemClose: React.useCallback(() => collapsible && setValue(""), [collapsible, setValue]),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionCollapsibleProvider, { scope: props.__scopeAccordion, collapsible, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImpl, { ...accordionSingleProps, ref: forwardedRef }) })
      }
    );
  }
);
var AccordionImplMultiple = React.forwardRef((props, forwardedRef) => {
  const {
    value: valueProp,
    defaultValue,
    onValueChange = () => {
    },
    ...accordionMultipleProps
  } = props;
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? [],
    onChange: onValueChange,
    caller: ACCORDION_NAME
  });
  const handleItemOpen = React.useCallback(
    (itemValue) => setValue((prevValue = []) => [...prevValue, itemValue]),
    [setValue]
  );
  const handleItemClose = React.useCallback(
    (itemValue) => setValue((prevValue = []) => prevValue.filter((value2) => value2 !== itemValue)),
    [setValue]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    AccordionValueProvider,
    {
      scope: props.__scopeAccordion,
      value,
      onItemOpen: handleItemOpen,
      onItemClose: handleItemClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionCollapsibleProvider, { scope: props.__scopeAccordion, collapsible: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImpl, { ...accordionMultipleProps, ref: forwardedRef }) })
    }
  );
});
var [AccordionImplProvider, useAccordionContext] = createAccordionContext(ACCORDION_NAME);
var AccordionImpl = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, disabled, dir, orientation = "vertical", ...accordionProps } = props;
    const accordionRef = React.useRef(null);
    const composedRefs = useComposedRefs(accordionRef, forwardedRef);
    const getItems = useCollection(__scopeAccordion);
    const direction = useDirection(dir);
    const isDirectionLTR = direction === "ltr";
    const handleKeyDown = composeEventHandlers(props.onKeyDown, (event) => {
      var _a;
      if (!ACCORDION_KEYS.includes(event.key)) return;
      const target = event.target;
      const triggerCollection = getItems().filter((item) => {
        var _a2;
        return !((_a2 = item.ref.current) == null ? void 0 : _a2.disabled);
      });
      const triggerIndex = triggerCollection.findIndex((item) => item.ref.current === target);
      const triggerCount = triggerCollection.length;
      if (triggerIndex === -1) return;
      event.preventDefault();
      let nextIndex = triggerIndex;
      const homeIndex = 0;
      const endIndex = triggerCount - 1;
      const moveNext = () => {
        nextIndex = triggerIndex + 1;
        if (nextIndex > endIndex) {
          nextIndex = homeIndex;
        }
      };
      const movePrev = () => {
        nextIndex = triggerIndex - 1;
        if (nextIndex < homeIndex) {
          nextIndex = endIndex;
        }
      };
      switch (event.key) {
        case "Home":
          nextIndex = homeIndex;
          break;
        case "End":
          nextIndex = endIndex;
          break;
        case "ArrowRight":
          if (orientation === "horizontal") {
            if (isDirectionLTR) {
              moveNext();
            } else {
              movePrev();
            }
          }
          break;
        case "ArrowDown":
          if (orientation === "vertical") {
            moveNext();
          }
          break;
        case "ArrowLeft":
          if (orientation === "horizontal") {
            if (isDirectionLTR) {
              movePrev();
            } else {
              moveNext();
            }
          }
          break;
        case "ArrowUp":
          if (orientation === "vertical") {
            movePrev();
          }
          break;
      }
      const clampedIndex = nextIndex % triggerCount;
      (_a = triggerCollection[clampedIndex].ref.current) == null ? void 0 : _a.focus();
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AccordionImplProvider,
      {
        scope: __scopeAccordion,
        disabled,
        direction: dir,
        orientation,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Slot, { scope: __scopeAccordion, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            ...accordionProps,
            "data-orientation": orientation,
            ref: composedRefs,
            onKeyDown: disabled ? void 0 : handleKeyDown
          }
        ) })
      }
    );
  }
);
var ITEM_NAME = "AccordionItem";
var [AccordionItemProvider, useAccordionItemContext] = createAccordionContext(ITEM_NAME);
var AccordionItem$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, value, ...accordionItemProps } = props;
    const accordionContext = useAccordionContext(ITEM_NAME, __scopeAccordion);
    const valueContext = useAccordionValueContext(ITEM_NAME, __scopeAccordion);
    const collapsibleScope = useCollapsibleScope(__scopeAccordion);
    const triggerId = useId();
    const open = value && valueContext.value.includes(value) || false;
    const disabled = accordionContext.disabled || props.disabled;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AccordionItemProvider,
      {
        scope: __scopeAccordion,
        open,
        disabled,
        triggerId,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Root$1,
          {
            "data-orientation": accordionContext.orientation,
            "data-state": getState(open),
            ...collapsibleScope,
            ...accordionItemProps,
            ref: forwardedRef,
            disabled,
            open,
            onOpenChange: (open2) => {
              if (open2) {
                valueContext.onItemOpen(value);
              } else {
                valueContext.onItemClose(value);
              }
            }
          }
        )
      }
    );
  }
);
AccordionItem$1.displayName = ITEM_NAME;
var HEADER_NAME = "AccordionHeader";
var AccordionHeader = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, ...headerProps } = props;
    const accordionContext = useAccordionContext(ACCORDION_NAME, __scopeAccordion);
    const itemContext = useAccordionItemContext(HEADER_NAME, __scopeAccordion);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.h3,
      {
        "data-orientation": accordionContext.orientation,
        "data-state": getState(itemContext.open),
        "data-disabled": itemContext.disabled ? "" : void 0,
        ...headerProps,
        ref: forwardedRef
      }
    );
  }
);
AccordionHeader.displayName = HEADER_NAME;
var TRIGGER_NAME = "AccordionTrigger";
var AccordionTrigger$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, ...triggerProps } = props;
    const accordionContext = useAccordionContext(ACCORDION_NAME, __scopeAccordion);
    const itemContext = useAccordionItemContext(TRIGGER_NAME, __scopeAccordion);
    const collapsibleContext = useAccordionCollapsibleContext(TRIGGER_NAME, __scopeAccordion);
    const collapsibleScope = useCollapsibleScope(__scopeAccordion);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.ItemSlot, { scope: __scopeAccordion, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Trigger,
      {
        "aria-disabled": itemContext.open && !collapsibleContext.collapsible || void 0,
        "data-orientation": accordionContext.orientation,
        id: itemContext.triggerId,
        ...collapsibleScope,
        ...triggerProps,
        ref: forwardedRef
      }
    ) });
  }
);
AccordionTrigger$1.displayName = TRIGGER_NAME;
var CONTENT_NAME = "AccordionContent";
var AccordionContent$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, ...contentProps } = props;
    const accordionContext = useAccordionContext(ACCORDION_NAME, __scopeAccordion);
    const itemContext = useAccordionItemContext(CONTENT_NAME, __scopeAccordion);
    const collapsibleScope = useCollapsibleScope(__scopeAccordion);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Content,
      {
        role: "region",
        "aria-labelledby": itemContext.triggerId,
        "data-orientation": accordionContext.orientation,
        ...collapsibleScope,
        ...contentProps,
        ref: forwardedRef,
        style: {
          ["--radix-accordion-content-height"]: "var(--radix-collapsible-content-height)",
          ["--radix-accordion-content-width"]: "var(--radix-collapsible-content-width)",
          ...props.style
        }
      }
    );
  }
);
AccordionContent$1.displayName = CONTENT_NAME;
function getState(open) {
  return open ? "open" : "closed";
}
var Root2 = Accordion$1;
var Item = AccordionItem$1;
var Header = AccordionHeader;
var Trigger2 = AccordionTrigger$1;
var Content2 = AccordionContent$1;
function Accordion({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Root2, { "data-slot": "accordion", ...props });
}
function AccordionItem({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Item,
    {
      "data-slot": "accordion-item",
      className: cn("border-b last:border-b-0", className),
      ...props
    }
  );
}
function AccordionTrigger({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Header, { className: "flex", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Trigger2,
    {
      "data-slot": "accordion-trigger",
      className: cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" })
      ]
    }
  ) });
}
function AccordionContent({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Content2,
    {
      "data-slot": "accordion-content",
      className: "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm",
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("pt-0 pb-4", className), children })
    }
  );
}
function createContextScope(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext3(rootComponentName, defaultContext) {
    const BaseContext = reactExports.createContext(defaultContext);
    BaseContext.displayName = rootComponentName + "Context";
    const index = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    const Provider = (props) => {
      var _a;
      const { scope, children, ...context } = props;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const value = reactExports.useMemo(() => context, Object.values(context));
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Context.Provider, { value, children });
    };
    Provider.displayName = rootComponentName + "Provider";
    function useContext2(consumerName, scope) {
      var _a;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const context = reactExports.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    return [Provider, useContext2];
  }
  const createScope = () => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return reactExports.createContext(defaultContext);
    });
    return function useScope(scope) {
      const contexts = (scope == null ? void 0 : scope[scopeName]) || scopeContexts;
      return reactExports.useMemo(
        () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),
        [scope, contexts]
      );
    };
  };
  createScope.scopeName = scopeName;
  return [createContext3, composeContextScopes(createScope, ...createContextScopeDeps)];
}
function composeContextScopes(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = () => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return function useComposedScopes(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return { ...nextScopes2, ...currentScope };
      }, {});
      return reactExports.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);
    };
  };
  createScope.scopeName = baseScope.scopeName;
  return createScope;
}
var PROGRESS_NAME = "Progress";
var DEFAULT_MAX = 100;
var [createProgressContext] = createContextScope(PROGRESS_NAME);
var [ProgressProvider, useProgressContext] = createProgressContext(PROGRESS_NAME);
var Progress$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeProgress,
      value: valueProp = null,
      max: maxProp,
      getValueLabel = defaultGetValueLabel,
      ...progressProps
    } = props;
    if ((maxProp || maxProp === 0) && !isValidMaxNumber(maxProp)) {
      console.error(getInvalidMaxError(`${maxProp}`, "Progress"));
    }
    const max = isValidMaxNumber(maxProp) ? maxProp : DEFAULT_MAX;
    if (valueProp !== null && !isValidValueNumber(valueProp, max)) {
      console.error(getInvalidValueError(`${valueProp}`, "Progress"));
    }
    const value = isValidValueNumber(valueProp, max) ? valueProp : null;
    const valueLabel = isNumber(value) ? getValueLabel(value, max) : void 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressProvider, { scope: __scopeProgress, value, max, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive$1.div,
      {
        "aria-valuemax": max,
        "aria-valuemin": 0,
        "aria-valuenow": isNumber(value) ? value : void 0,
        "aria-valuetext": valueLabel,
        role: "progressbar",
        "data-state": getProgressState(value, max),
        "data-value": value ?? void 0,
        "data-max": max,
        ...progressProps,
        ref: forwardedRef
      }
    ) });
  }
);
Progress$1.displayName = PROGRESS_NAME;
var INDICATOR_NAME = "ProgressIndicator";
var ProgressIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeProgress, ...indicatorProps } = props;
    const context = useProgressContext(INDICATOR_NAME, __scopeProgress);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive$1.div,
      {
        "data-state": getProgressState(context.value, context.max),
        "data-value": context.value ?? void 0,
        "data-max": context.max,
        ...indicatorProps,
        ref: forwardedRef
      }
    );
  }
);
ProgressIndicator.displayName = INDICATOR_NAME;
function defaultGetValueLabel(value, max) {
  return `${Math.round(value / max * 100)}%`;
}
function getProgressState(value, maxValue) {
  return value == null ? "indeterminate" : value === maxValue ? "complete" : "loading";
}
function isNumber(value) {
  return typeof value === "number";
}
function isValidMaxNumber(max) {
  return isNumber(max) && !isNaN(max) && max > 0;
}
function isValidValueNumber(value, max) {
  return isNumber(value) && !isNaN(value) && value <= max && value >= 0;
}
function getInvalidMaxError(propValue, componentName) {
  return `Invalid prop \`max\` of value \`${propValue}\` supplied to \`${componentName}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${DEFAULT_MAX}\`.`;
}
function getInvalidValueError(propValue, componentName) {
  return `Invalid prop \`value\` of value \`${propValue}\` supplied to \`${componentName}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${DEFAULT_MAX} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
}
var Root = Progress$1;
var Indicator = ProgressIndicator;
function Progress({
  className,
  value,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root,
    {
      "data-slot": "progress",
      className: cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Indicator,
        {
          "data-slot": "progress-indicator",
          className: "bg-primary h-full w-full flex-1 transition-all",
          style: { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      )
    }
  );
}
async function yieldToUI() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}
function isProgressMessage(msg) {
  return msg.type === "progress";
}
function isBatchResultMessage(msg) {
  return msg.type === "batch";
}
function isCompleteMessage(msg) {
  return msg.type === "complete";
}
function isCancelAckMessage(msg) {
  return msg.type === "cancelAck";
}
function isErrorMessage(msg) {
  return msg.type === "error";
}
function isCapabilityMessage(msg) {
  return msg.type === "capability";
}
class SimpleZipCreator {
  constructor() {
    __publicField(this, "files", []);
  }
  addFile(path, data) {
    const uint8Data = typeof data === "string" ? new TextEncoder().encode(data) : data;
    this.files.push({ name: path, data: uint8Data });
  }
  async generate() {
    const chunks = [];
    const centralDirectory = [];
    let offset = 0;
    for (const file of this.files) {
      const fileName = new TextEncoder().encode(file.name);
      const fileData = file.data;
      const localHeader = new Uint8Array(30 + fileName.length);
      const view = new DataView(localHeader.buffer);
      view.setUint32(0, 67324752, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint32(14, this.crc32(fileData), true);
      view.setUint32(18, fileData.length, true);
      view.setUint32(22, fileData.length, true);
      view.setUint16(26, fileName.length, true);
      view.setUint16(28, 0, true);
      localHeader.set(fileName, 30);
      chunks.push(localHeader);
      chunks.push(fileData);
      const centralHeader = new Uint8Array(46 + fileName.length);
      const cdView = new DataView(centralHeader.buffer);
      cdView.setUint32(0, 33639248, true);
      cdView.setUint16(4, 20, true);
      cdView.setUint16(6, 20, true);
      cdView.setUint16(8, 0, true);
      cdView.setUint16(10, 0, true);
      cdView.setUint16(12, 0, true);
      cdView.setUint16(14, 0, true);
      cdView.setUint32(16, this.crc32(fileData), true);
      cdView.setUint32(20, fileData.length, true);
      cdView.setUint32(24, fileData.length, true);
      cdView.setUint16(28, fileName.length, true);
      cdView.setUint16(30, 0, true);
      cdView.setUint16(32, 0, true);
      cdView.setUint16(34, 0, true);
      cdView.setUint16(36, 0, true);
      cdView.setUint32(38, 0, true);
      cdView.setUint32(42, offset, true);
      centralHeader.set(fileName, 46);
      centralDirectory.push(centralHeader);
      offset += localHeader.length + fileData.length;
    }
    const cdSize = centralDirectory.reduce((sum, cd) => sum + cd.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 101010256, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, this.files.length, true);
    endView.setUint16(10, this.files.length, true);
    endView.setUint32(12, cdSize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);
    const allChunks = [...chunks, ...centralDirectory, endRecord];
    const totalLength = allChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let position = 0;
    for (const chunk of allChunks) {
      result.set(chunk, position);
      position += chunk.length;
    }
    return new Blob([result], { type: "application/zip" });
  }
  crc32(data) {
    let crc = 4294967295;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        crc = crc >>> 1 ^ 3988292384 & -(crc & 1);
      }
    }
    return (crc ^ 4294967295) >>> 0;
  }
}
function generateDNA(traits, layers) {
  return layers.map((layer) => traits[layer.id] || "").join("-");
}
function Vault({ project, onUpdateProject }) {
  const [isGenerating, setIsGenerating] = reactExports.useState(false);
  const [progress, setProgress] = reactExports.useState(0);
  const [generatedCount, setGeneratedCount] = reactExports.useState(0);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [isExporting, setIsExporting] = reactExports.useState(false);
  const [selectedNFT, setSelectedNFT] = reactExports.useState(null);
  const [sortOption, setSortOption] = reactExports.useState("index");
  const [viewMode, setViewMode] = reactExports.useState("compact");
  const [activeFilters, setActiveFilters] = reactExports.useState(
    /* @__PURE__ */ new Map()
  );
  const [isRegeneratingNFT, setIsRegeneratingNFT] = reactExports.useState(false);
  const [headlessMode, setHeadlessMode] = reactExports.useState(false);
  const imageCache = reactExports.useRef({});
  const filterDebounceTimer = reactExports.useRef(
    null
  );
  const workerRef = reactExports.useRef(null);
  const workerSupportsImageCompositing = reactExports.useRef(false);
  const accumulatedNFTs = reactExports.useRef([]);
  reactExports.useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);
  const traitFrequencyMap = reactExports.useMemo(() => {
    const frequencyMap = {};
    const totalNFTs = project.generatedNFTs.filter(
      (nft) => !nft.isForged
    ).length;
    if (totalNFTs === 0) return frequencyMap;
    for (const nft of project.generatedNFTs) {
      if (nft.isForged) continue;
      const attributes = nft.metadata.attributes;
      for (const attr of attributes) {
        if (attr.trait_type === "Type" && attr.value === "1-of-1") continue;
        const layer = project.layers.find((l) => l.name === attr.trait_type);
        const trait = layer == null ? void 0 : layer.traits.find((t) => t.name === attr.value);
        if (layer && trait) {
          if (!frequencyMap[layer.id]) {
            frequencyMap[layer.id] = {};
          }
          frequencyMap[layer.id][trait.id] = (frequencyMap[layer.id][trait.id] || 0) + 1;
        }
      }
    }
    for (const layerId of Object.keys(frequencyMap)) {
      for (const traitId of Object.keys(frequencyMap[layerId])) {
        frequencyMap[layerId][traitId] = frequencyMap[layerId][traitId] / totalNFTs;
      }
    }
    return frequencyMap;
  }, [project.generatedNFTs, project.layers]);
  const groupedTraitsByLayer = reactExports.useMemo(() => {
    const traitCounts = {};
    const totalNFTs = project.generatedNFTs.length;
    for (const nft of project.generatedNFTs) {
      const attributes = nft.metadata.attributes;
      for (const attr of attributes) {
        if (attr.trait_type === "Type" && attr.value === "1-of-1") continue;
        const layer = project.layers.find((l) => l.name === attr.trait_type);
        const trait = layer == null ? void 0 : layer.traits.find((t) => t.name === attr.value);
        if (layer && trait) {
          const key = `${layer.id}-${trait.id}`;
          traitCounts[key] = (traitCounts[key] || 0) + 1;
        }
      }
    }
    const layerGroups = project.layers.map((layer) => {
      const traits = layer.traits.map((trait) => {
        const key = `${layer.id}-${trait.id}`;
        const count = traitCounts[key] || 0;
        const percentage = totalNFTs > 0 ? count / totalNFTs * 100 : 0;
        return {
          traitId: trait.id,
          traitName: trait.name,
          count,
          percentage
        };
      });
      return {
        layerId: layer.id,
        layerName: layer.name,
        traits
      };
    });
    return layerGroups;
  }, [project.layers, project.generatedNFTs]);
  const rarityScoreCache = reactExports.useMemo(() => {
    var _a;
    const cache = /* @__PURE__ */ new Map();
    for (const nft of project.generatedNFTs) {
      if (nft.isForged) {
        cache.set(nft.dna, 1e-4);
        continue;
      }
      const attributes = nft.metadata.attributes;
      let rarityProduct = 1;
      let validTraitCount = 0;
      for (const attr of attributes) {
        if (attr.trait_type === "Type" && attr.value === "1-of-1") continue;
        const layer = project.layers.find((l) => l.name === attr.trait_type);
        const trait = layer == null ? void 0 : layer.traits.find((t) => t.name === attr.value);
        if (layer && trait && ((_a = traitFrequencyMap[layer.id]) == null ? void 0 : _a[trait.id])) {
          const frequency = traitFrequencyMap[layer.id][trait.id];
          rarityProduct *= frequency;
          validTraitCount++;
        }
      }
      if (validTraitCount === 0) {
        cache.set(nft.dna, 0.5);
      } else {
        cache.set(nft.dna, rarityProduct);
      }
    }
    return cache;
  }, [project.generatedNFTs, project.layers, traitFrequencyMap]);
  const rarityInfoMap = reactExports.useMemo(() => {
    const infoMap = /* @__PURE__ */ new Map();
    const sortedNFTs = [...project.generatedNFTs].sort((a, b) => {
      const scoreA = rarityScoreCache.get(a.dna) || 0.5;
      const scoreB = rarityScoreCache.get(b.dna) || 0.5;
      return scoreA - scoreB;
    });
    const totalItems = sortedNFTs.length;
    sortedNFTs.forEach((nft, index) => {
      const rank = index + 1;
      const percentile = totalItems > 0 ? rank / totalItems : 0;
      const score = rarityScoreCache.get(nft.dna) || 0.5;
      let tier = "Common";
      if (nft.isForged) {
        tier = "Legendary";
      } else if (percentile <= 0.01) {
        tier = "Epic";
      } else if (percentile <= 0.05) {
        tier = "Ultra Rare";
      } else if (percentile <= 0.15) {
        tier = "Rare";
      } else if (percentile <= 0.3) {
        tier = "Uncommon";
      }
      infoMap.set(nft.dna, {
        score,
        rank,
        percentile,
        tier
      });
    });
    return infoMap;
  }, [project.generatedNFTs, rarityScoreCache]);
  const getRarityInfo = reactExports.useCallback(
    (nft) => {
      return rarityInfoMap.get(nft.dna) || {
        score: 0.5,
        rank: 0,
        percentile: 0,
        tier: "Common"
      };
    },
    [rarityInfoMap]
  );
  const toggleTraitFilter = reactExports.useCallback(
    (layerId, traitId, layerName, traitName) => {
      if (filterDebounceTimer.current) {
        clearTimeout(filterDebounceTimer.current);
      }
      filterDebounceTimer.current = setTimeout(() => {
        setActiveFilters((prev) => {
          const newFilters = new Map(prev);
          const key = `${layerId}-${traitId}`;
          if (newFilters.has(key)) {
            newFilters.delete(key);
            ue.success(`Filter removed: ${traitName}`);
          } else {
            newFilters.set(key, { layerId, traitId, layerName, traitName });
            ue.success(`Filtered by ${traitName}`);
          }
          return newFilters;
        });
      }, 150);
    },
    []
  );
  const clearAllFilters = reactExports.useCallback(() => {
    setActiveFilters(/* @__PURE__ */ new Map());
    setSearchQuery("");
    ue.success("All filters cleared");
  }, []);
  const filteredAndSortedNFTs = reactExports.useMemo(() => {
    let result = [...project.generatedNFTs];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const queryAsNumber = Number.parseInt(searchQuery, 10);
      result = result.filter((nft) => {
        if (!Number.isNaN(queryAsNumber) && nft.id === queryAsNumber)
          return true;
        if (nft.metadata.name && String(nft.metadata.name).toLowerCase().includes(query))
          return true;
        const attributes = nft.metadata.attributes;
        if (!attributes || !Array.isArray(attributes)) return false;
        return attributes.some((attr) => {
          if (!attr || !attr.trait_type || !attr.value) return false;
          return attr.trait_type.toLowerCase().includes(query) || attr.value.toLowerCase().includes(query);
        });
      });
    }
    if (activeFilters.size > 0) {
      const filtersByLayer = {};
      for (const filter of activeFilters.values()) {
        if (!filtersByLayer[filter.layerId]) {
          filtersByLayer[filter.layerId] = /* @__PURE__ */ new Set();
        }
        filtersByLayer[filter.layerId].add(filter.traitId);
      }
      result = result.filter((nft) => {
        var _a;
        if ((_a = filtersByLayer.forged) == null ? void 0 : _a.has("1-of-1")) {
          if (nft.isForged) {
            if (Object.keys(filtersByLayer).length === 1) {
              return true;
            }
            return false;
          }
        }
        const attributes = nft.metadata.attributes;
        if (!attributes || !Array.isArray(attributes)) return false;
        const nftTraitsByLayer = {};
        for (const attr of attributes) {
          if (!attr || !attr.trait_type || !attr.value) continue;
          if (attr.trait_type === "Type" && attr.value === "1-of-1") continue;
          const layer = project.layers.find((l) => l.name === attr.trait_type);
          const trait = layer == null ? void 0 : layer.traits.find((t) => t.name === attr.value);
          if (layer && trait) {
            if (!nftTraitsByLayer[layer.id]) {
              nftTraitsByLayer[layer.id] = /* @__PURE__ */ new Set();
            }
            nftTraitsByLayer[layer.id].add(trait.id);
          }
        }
        for (const layerId of Object.keys(filtersByLayer)) {
          if (layerId === "forged") continue;
          const requiredTraits = filtersByLayer[layerId];
          const nftTraits = nftTraitsByLayer[layerId];
          if (!nftTraits) {
            return false;
          }
          let hasMatchInLayer = false;
          for (const traitId of requiredTraits) {
            if (nftTraits.has(traitId)) {
              hasMatchInLayer = true;
              break;
            }
          }
          if (!hasMatchInLayer) {
            return false;
          }
        }
        return true;
      });
    }
    result.sort((a, b) => {
      const infoA = getRarityInfo(a);
      const infoB = getRarityInfo(b);
      switch (sortOption) {
        case "index":
          return a.id - b.id;
        case "rarity":
          return infoA.rank - infoB.rank;
        case "common":
          return infoB.rank - infoA.rank;
        default:
          return 0;
      }
    });
    return result;
  }, [
    project.generatedNFTs,
    project.layers,
    searchQuery,
    sortOption,
    activeFilters,
    getRarityInfo
  ]);
  const isValidCombination = reactExports.useCallback(
    (traits) => {
      for (const rule of project.rules) {
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
    },
    [project.rules]
  );
  const loadImageWithCache = reactExports.useCallback(
    async (src) => {
      if (imageCache.current[src]) {
        return imageCache.current[src];
      }
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          imageCache.current[src] = img;
          resolve(img);
        };
        img.onerror = reject;
        img.src = src;
      });
    },
    []
  );
  const generateImage = reactExports.useCallback(
    async (traits) => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false
      });
      if (!ctx) throw new Error("Canvas context not available");
      if (project.pixelArtMode) {
        ctx.imageSmoothingEnabled = false;
      }
      const imagePromises = project.layers.map(async (layer) => {
        const traitId = traits[layer.id];
        if (!traitId) return null;
        const trait = layer.traits.find((t) => t.id === traitId);
        if (!trait) return null;
        const img = await loadImageWithCache(trait.imageData);
        return { img, layer };
      });
      const loadedImages = await Promise.all(imagePromises);
      for (let i = loadedImages.length - 1; i >= 0; i--) {
        const item = loadedImages[i];
        if (!item) continue;
        const { img, layer } = item;
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      const dataURL = canvas.toDataURL("image/png");
      canvas.width = 0;
      canvas.height = 0;
      return dataURL;
    },
    [project.layers, project.pixelArtMode, loadImageWithCache]
  );
  const regenerateSingleNFT = async (nft) => {
    if (nft.isForged) {
      ue.error("Cannot regenerate forged token");
      return;
    }
    setIsRegeneratingNFT(true);
    const validLayers = project.layers.filter((l) => l.traits.length > 0);
    if (validLayers.length === 0) {
      ue.error("Add layers first");
      setIsRegeneratingNFT(false);
      return;
    }
    const usedDNAs = new Set(
      project.generatedNFTs.filter((n) => n.id !== nft.id).map((n) => n.dna)
    );
    let attempts = 0;
    const maxAttempts = 100;
    let newNFT = null;
    while (attempts < maxAttempts && !newNFT) {
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
      const dna = generateDNA(selectedTraits, project.layers);
      if (usedDNAs.has(dna)) continue;
      if (!isValidCombination(selectedTraits)) continue;
      try {
        const imageData = await generateImage(selectedTraits);
        const metadata = createMetadata(nft.id, selectedTraits);
        newNFT = {
          id: nft.id,
          dna,
          imageData,
          metadata,
          isForged: false
        };
      } catch (error) {
        console.error("Error regenerating NFT:", error);
      }
    }
    if (newNFT) {
      onUpdateProject((p) => ({
        ...p,
        generatedNFTs: p.generatedNFTs.map(
          (n) => n.id === nft.id ? newNFT : n
        )
      }));
      setSelectedNFT(newNFT);
      ue.success(`NFT #${nft.id} regenerated`);
    } else {
      ue.error("Regeneration failed");
    }
    setIsRegeneratingNFT(false);
  };
  const exportSingleNFT = async (nft) => {
    try {
      const base64Data = nft.imageData.split(",")[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }
      const imageBlob = new Blob([bytes], { type: "image/png" });
      const imageUrl = URL.createObjectURL(imageBlob);
      const imageLink = document.createElement("a");
      imageLink.href = imageUrl;
      imageLink.download = `${project.name.replace(/\s+/g, "_")}_${nft.id}.png`;
      document.body.appendChild(imageLink);
      imageLink.click();
      document.body.removeChild(imageLink);
      URL.revokeObjectURL(imageUrl);
      const metadataJson = JSON.stringify(nft.metadata, null, 2);
      const metadataBlob = new Blob([metadataJson], {
        type: "application/json"
      });
      const metadataUrl = URL.createObjectURL(metadataBlob);
      const metadataLink = document.createElement("a");
      metadataLink.href = metadataUrl;
      metadataLink.download = `${project.name.replace(/\s+/g, "_")}_${nft.id}.json`;
      document.body.appendChild(metadataLink);
      metadataLink.click();
      document.body.removeChild(metadataLink);
      URL.revokeObjectURL(metadataUrl);
      ue.success("NFT exported");
    } catch (error) {
      console.error("Export error:", error);
      ue.error("Export failed");
    }
  };
  const cancelGeneration = reactExports.useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "cancel" });
      ue.info("Canceling generation...");
    }
  }, []);
  const compositeFallbackImages = async (nfts) => {
    const result = [];
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      if (nft.imageData) {
        result.push(nft);
      } else if (nft.selectedTraits) {
        try {
          const imageData = await generateImage(nft.selectedTraits);
          result.push({
            ...nft,
            imageData
          });
        } catch (error) {
          console.error("Fallback compositing error:", error);
        }
      }
      if (i % 50 === 0) {
        await yieldToUI();
      }
    }
    return result;
  };
  const generateCollection = async () => {
    const currentSortOption = sortOption;
    const currentSearchQuery = searchQuery;
    const currentActiveFilters = new Map(activeFilters);
    const currentViewMode = viewMode;
    setIsGenerating(true);
    setProgress(0);
    setGeneratedCount(0);
    accumulatedNFTs.current = [];
    const validLayers = project.layers.filter((l) => l.traits.length > 0);
    if (validLayers.length === 0) {
      ue.error("Add layers first");
      setIsGenerating(false);
      return;
    }
    try {
      onUpdateProject((p) => ({
        ...p,
        generatedNFTs: []
      }));
      workerRef.current = new Worker(
        new URL(
          /* @vite-ignore */
          "/assets/vaultGenerator.worker-LtxObuQw.js",
          import.meta.url
        ),
        {
          type: "module"
        }
      );
      workerRef.current.onmessage = async (event) => {
        const message = event.data;
        if (isCapabilityMessage(message)) {
          workerSupportsImageCompositing.current = message.payload.supportsImageCompositing;
          if (!message.payload.supportsImageCompositing) {
            console.log(
              "Worker does not support image compositing, will use main-thread fallback"
            );
          }
        } else if (isProgressMessage(message)) {
          setGeneratedCount(message.payload.generatedCount);
          setProgress(message.payload.percentage);
        } else if (isBatchResultMessage(message)) {
          let batchNFTs;
          if (!message.payload.supportsImageCompositing) {
            batchNFTs = await compositeFallbackImages(message.payload.nfts);
          } else {
            batchNFTs = message.payload.nfts;
          }
          accumulatedNFTs.current.push(...batchNFTs);
          onUpdateProject((p) => ({
            ...p,
            generatedNFTs: [...accumulatedNFTs.current]
          }));
        } else if (isCompleteMessage(message)) {
          const allGeneratedNFTs = [...accumulatedNFTs.current];
          allGeneratedNFTs.sort((a, b) => a.id - b.id);
          onUpdateProject((p) => ({
            ...p,
            generatedNFTs: allGeneratedNFTs,
            lastGeneratedAt: Date.now()
          }));
          setSortOption(currentSortOption);
          setSearchQuery(currentSearchQuery);
          setActiveFilters(currentActiveFilters);
          setViewMode(currentViewMode);
          if (allGeneratedNFTs.length < project.collectionSize) {
            ue.warning(
              `Generated ${allGeneratedNFTs.length} of ${project.collectionSize}`
            );
          } else {
            ue.success(`Generated ${allGeneratedNFTs.length} NFTs`);
          }
          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
          }
          imageCache.current = {};
          accumulatedNFTs.current = [];
          setIsGenerating(false);
          setProgress(0);
          setGeneratedCount(0);
        } else if (isCancelAckMessage(message)) {
          ue.warning(
            `Generation canceled at ${accumulatedNFTs.current.length} NFTs`
          );
          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
          }
          imageCache.current = {};
          accumulatedNFTs.current = [];
          setIsGenerating(false);
          setProgress(0);
          setGeneratedCount(0);
        } else if (isErrorMessage(message)) {
          ue.error(message.payload.message);
          console.error("Worker error:", message.payload.details);
          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
          }
          imageCache.current = {};
          accumulatedNFTs.current = [];
          setIsGenerating(false);
          setProgress(0);
          setGeneratedCount(0);
        }
      };
      workerRef.current.onerror = (error) => {
        console.error("Worker error:", error);
        ue.error("Generation failed");
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        imageCache.current = {};
        accumulatedNFTs.current = [];
        setIsGenerating(false);
        setProgress(0);
        setGeneratedCount(0);
      };
      const layers = project.layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        traits: layer.traits.map((trait) => ({
          id: trait.id,
          name: trait.name,
          weight: trait.weight,
          imageData: trait.imageData
        })),
        opacity: layer.opacity,
        blendMode: layer.blendMode
      }));
      const rules = project.rules.map((rule) => ({
        type: rule.type,
        primaryTrait: {
          layerId: rule.primaryTrait.layerId,
          traitId: rule.primaryTrait.traitId
        },
        incompatibleTraits: rule.incompatibleTraits.map((t) => ({
          layerId: t.layerId,
          traitId: t.traitId
        }))
      }));
      const forgedTokens = project.customTokens.map(
        (token) => ({
          id: token.id,
          imageData: token.imageData || ""
        })
      );
      const batchSize = project.collectionSize > 5e3 ? 100 : project.collectionSize > 1e3 ? 250 : 500;
      workerRef.current.postMessage({
        type: "start",
        payload: {
          layers,
          rules,
          forgedTokens,
          collectionSize: project.collectionSize,
          projectName: project.name,
          blockchain: project.blockchain,
          symbol: project.symbol,
          pixelArtMode: project.pixelArtMode,
          batchSize
        }
      });
    } catch (error) {
      console.error("Generation error:", error);
      ue.error("Generation failed");
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      imageCache.current = {};
      accumulatedNFTs.current = [];
      setIsGenerating(false);
      setProgress(0);
      setGeneratedCount(0);
    }
  };
  const createMetadata = (id, traits) => {
    const attributes = project.layers.filter((l) => traits[l.id]).map((layer) => {
      const trait = layer.traits.find((t) => t.id === traits[layer.id]);
      return {
        trait_type: layer.name,
        value: (trait == null ? void 0 : trait.name) || "Unknown"
      };
    });
    const baseMetadata = {
      name: `${project.name} #${id}`,
      description: `${project.name} NFT Collection`,
      image: `${id}.png`,
      attributes
    };
    if (project.blockchain === "SOL") {
      return {
        ...baseMetadata,
        symbol: project.symbol,
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
  };
  const exportCollection = async () => {
    if (project.generatedNFTs.length === 0) {
      ue.error("Generate collection first");
      return;
    }
    setIsExporting(true);
    ue.info("Exporting metadata...");
    try {
      const masterMetadata = project.generatedNFTs.map(
        (nft) => nft.metadata
      );
      const blob = new Blob([JSON.stringify(masterMetadata, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, "_")}_metadata.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      ue.success("Metadata exported");
      setIsExporting(false);
    } catch (error) {
      console.error("Export error:", error);
      ue.error("Export failed");
      setIsExporting(false);
    }
  };
  const downloadAllAsZip = async () => {
    if (project.generatedNFTs.length === 0) {
      ue.error("Generate collection first");
      return;
    }
    setIsExporting(true);
    setProgress(0);
    ue.info("Creating ZIP archive...");
    try {
      const zip = new SimpleZipCreator();
      const totalItems = project.generatedNFTs.length;
      for (let i = 0; i < project.generatedNFTs.length; i++) {
        const nft = project.generatedNFTs[i];
        const base64Data = nft.imageData.split(",")[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        zip.addFile(`images/${nft.id}.png`, bytes);
        const metadataJson = JSON.stringify(nft.metadata, null, 2);
        zip.addFile(`json/${nft.id}.json`, metadataJson);
        setProgress((i + 1) / totalItems * 90);
      }
      const masterMetadata = project.generatedNFTs.map((nft) => nft.metadata);
      zip.addFile("_metadata.json", JSON.stringify(masterMetadata, null, 2));
      ue.info("Compressing files...");
      const zipBlob = await zip.generate();
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, "_")}_collection.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setProgress(100);
      ue.success("Collection downloaded");
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      console.error("ZIP export error:", error);
      ue.error("ZIP export failed");
      setIsExporting(false);
      setProgress(0);
    }
  };
  const isTraitActive = reactExports.useCallback(
    (layerId, traitId) => {
      return activeFilters.has(`${layerId}-${traitId}`);
    },
    [activeFilters]
  );
  const formatCollectionSize = (size) => {
    return size.toLocaleString();
  };
  const shouldShowGrid = !isGenerating || !headlessMode;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col lg:flex-row bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "hidden lg:flex lg:w-64 lg:flex-shrink-0 border-r border-border bg-card/30 flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-4 border-b border-border flex-shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FilterIcon, { className: "w-3.5 h-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-semibold text-foreground", children: "Layers" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
          project.generatedNFTs.length,
          " items"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto min-h-0 scroll-momentum", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Accordion, { type: "multiple", className: "px-2 py-2", children: groupedTraitsByLayer.map((layerGroup) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        AccordionItem,
        {
          value: layerGroup.layerId,
          className: "border-b border-border/50 last:border-0",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionTrigger, { className: "py-3 px-2 hover:bg-muted/50 rounded text-left focus-ring transition-all duration-hover ease-apple", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-foreground", children: layerGroup.layerName }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionContent, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0.5 px-2", children: layerGroup.traits.map((trait) => {
              const isActive = isTraitActive(
                layerGroup.layerId,
                trait.traitId
              );
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => toggleTraitFilter(
                    layerGroup.layerId,
                    trait.traitId,
                    layerGroup.layerName,
                    trait.traitName
                  ),
                  className: `motion-button motion-press-snappy w-full flex items-center justify-between px-2 py-1.5 rounded text-left ${isActive ? "bg-foreground/10 text-foreground scale-100" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium truncate pr-2", children: trait.traitName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-semibold flex-shrink-0", children: [
                      trait.percentage.toFixed(1),
                      "%"
                    ] })
                  ]
                },
                `${layerGroup.layerId}-${trait.traitId}`
              );
            }) }) })
          ]
        },
        layerGroup.layerId
      )) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col min-w-0 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6 py-3 border-b border-border bg-background flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VaultPublishingControls,
          {
            project,
            onUpdateProject
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full sm:flex-1 sm:max-w-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SearchIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                placeholder: "Search collection...",
                className: "pl-9 h-9 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus-ring transition-all duration-component ease-apple"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 w-full sm:w-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              VaultViewModeToggle,
              {
                viewMode,
                onViewModeChange: setViewMode
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:block w-px h-6 bg-border" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: sortOption === "index" ? "default" : "ghost",
                  size: "sm",
                  onClick: () => setSortOption("index"),
                  className: "motion-button motion-press-snappy h-8 px-3 text-[10px] font-semibold uppercase tracking-wide focus-ring",
                  children: "Index"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: sortOption === "rarity" ? "default" : "ghost",
                  size: "sm",
                  onClick: () => setSortOption("rarity"),
                  className: "motion-button motion-press-snappy h-8 px-3 text-[10px] font-semibold uppercase tracking-wide focus-ring",
                  children: "Rarity"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: sortOption === "common" ? "default" : "ghost",
                  size: "sm",
                  onClick: () => setSortOption("common"),
                  className: "motion-button motion-press-snappy h-8 px-3 text-[10px] font-semibold uppercase tracking-wide focus-ring",
                  children: "Common"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: exportCollection,
                disabled: isExporting || project.generatedNFTs.length === 0,
                variant: "outline",
                size: "sm",
                className: "motion-button motion-press-snappy h-8 px-3 text-[10px] font-semibold uppercase tracking-wide focus-ring",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DownloadIcon, { className: "w-3.5 h-3.5 mr-1.5" }),
                  "Export"
                ]
              }
            )
          ] })
        ] }),
        activeFilters.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-2 bg-muted/30 border border-border rounded-lg animate-fade-in-scale", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-medium text-foreground flex-1", children: [
            "Active filters:",
            " ",
            Array.from(activeFilters.values()).map((f) => f.traitName).join(", ")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: clearAllFilters,
              className: "motion-button h-6 px-2 text-[10px] font-semibold focus-ring",
              children: "Clear"
            }
          )
        ] }),
        (isGenerating || isExporting) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 animate-fade-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground font-medium", children: isGenerating ? `Generating: ${generatedCount} / ${project.collectionSize} (${Math.round(progress)}%)` : `${Math.round(progress)}%` }),
            isGenerating && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: cancelGeneration,
                className: "motion-button h-6 px-2 text-[10px] font-semibold focus-ring",
                children: "Cancel"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: progress, className: "h-1" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full scroll-momentum", children: shouldShowGrid && project.generatedNFTs.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 lg:p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `grid gap-3 stagger-grid ${viewMode === "compact" ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}`,
          children: filteredAndSortedNFTs.map((nft) => {
            const rarityInfo = getRarityInfo(nft);
            const tokenName = String(
              nft.metadata.name || `${project.name} #${nft.id}`
            );
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Card,
              {
                className: "group bg-card border border-border hover:border-foreground/30 overflow-hidden cursor-pointer trait-card-lift focus-ring p-0",
                onClick: () => setSelectedNFT(nft),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-square bg-muted/30 relative overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: nft.imageData,
                      alt: tokenName,
                      className: "w-full h-full object-cover block transition-transform duration-component ease-apple group-hover:scale-105",
                      style: {
                        imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                      }
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-medium text-foreground truncate", children: tokenName }),
                    viewMode === "grid" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground mt-0.5", children: [
                      rarityInfo.tier,
                      " • Rank #",
                      rarityInfo.rank,
                      " /",
                      " ",
                      formatCollectionSize(project.collectionSize)
                    ] })
                  ] })
                ]
              },
              nft.id
            );
          })
        }
      ) }) : !shouldShowGrid && isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold mb-2", children: "Generating Collection" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mb-1", children: "Low-memory mode active" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs", children: [
          generatedCount,
          " / ",
          project.collectionSize,
          " NFTs"
        ] })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl font-bold mb-2", children: "No NFTs" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Generate your collection to get started" })
      ] }) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6 py-3 border-t border-border bg-background flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-medium", children: [
            filteredAndSortedNFTs.length,
            " of ",
            project.generatedNFTs.length,
            " ",
            "items"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                id: "headless-mode",
                checked: headlessMode,
                onCheckedChange: setHeadlessMode,
                disabled: isGenerating,
                className: "transition-all duration-hover ease-apple"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "headless-mode",
                className: "text-xs text-muted-foreground cursor-pointer",
                children: "Low-memory mode"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 w-full sm:w-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: generateCollection,
              disabled: isGenerating || project.collectionLocked,
              className: "motion-button motion-press-snappy h-9 px-5 font-semibold text-xs focus-ring flex-1 sm:flex-initial",
              children: isGenerating ? "Generating..." : "Generate"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: downloadAllAsZip,
              disabled: isExporting || project.generatedNFTs.length === 0,
              variant: "outline",
              className: "motion-button motion-press-snappy h-9 px-5 font-semibold text-xs focus-ring flex-1 sm:flex-initial",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DownloadIcon, { className: "w-3.5 h-3.5 mr-2" }),
                isExporting ? `${Math.round(progress)}%` : "Download All"
              ]
            }
          )
        ] })
      ] }) })
    ] }),
    selectedNFT && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "fixed inset-0 motion-modal-overlay z-50 flex items-center justify-center p-4",
        onClick: () => setSelectedNFT(null),
        onKeyUp: (e) => e.key === "Escape" && setSelectedNFT(null),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "modal-premium-enter bg-card border border-border rounded-xl w-full max-w-5xl overflow-hidden shadow-2xl",
            style: { maxHeight: "85vh" },
            onClick: (e) => e.stopPropagation(),
            onKeyUp: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-5 py-3 border-b border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-foreground", children: String(
                  selectedNFT.metadata.name || `${project.name} #${selectedNFT.id}`
                ) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-medium", children: [
                    getRarityInfo(selectedNFT).tier,
                    " • Rank #",
                    getRarityInfo(selectedNFT).rank
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    MotionIconButton,
                    {
                      onClick: () => setSelectedNFT(null),
                      className: "h-8 w-8 text-foreground hover:bg-muted rounded focus-ring",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(XIcon, { className: "w-4 h-4" })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ScrollArea,
                {
                  className: "scroll-momentum",
                  style: { maxHeight: "calc(85vh - 60px)" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-3 space-y-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-square rounded-xl overflow-hidden bg-muted/30 border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: selectedNFT.imageData,
                          alt: String(selectedNFT.metadata.name),
                          className: "w-full h-full object-contain",
                          style: {
                            imageRendering: project.pixelArtMode ? "pixelated" : "auto"
                          }
                        }
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                        !selectedNFT.isForged && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Button,
                          {
                            onClick: () => regenerateSingleNFT(selectedNFT),
                            disabled: isRegeneratingNFT,
                            variant: "outline",
                            className: "motion-button motion-press-snappy h-9 text-xs font-semibold focus-ring",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                RefreshCwIcon,
                                {
                                  className: `w-3.5 h-3.5 mr-1.5 ${isRegeneratingNFT ? "animate-spin" : ""}`
                                }
                              ),
                              isRegeneratingNFT ? "Regenerating..." : "Regenerate"
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Button,
                          {
                            onClick: () => exportSingleNFT(selectedNFT),
                            variant: "outline",
                            className: `motion-button motion-press-snappy h-9 text-xs font-semibold focus-ring ${selectedNFT.isForged ? "col-span-2" : ""}`,
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(DownloadIcon, { className: "w-3.5 h-3.5 mr-1.5" }),
                              "Export"
                            ]
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 flex flex-col", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold text-muted-foreground mb-1", children: "Attributes" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                          selectedNFT.metadata.attributes.length,
                          " ",
                          "traits"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-2 flex-1", children: selectedNFT.metadata.attributes.map(
                        (attr) => {
                          if (attr.trait_type === "Type" && attr.value === "1-of-1") {
                            const isActive2 = isTraitActive("forged", "1-of-1");
                            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "button",
                              {
                                type: "button",
                                onClick: (e) => {
                                  e.stopPropagation();
                                  toggleTraitFilter(
                                    "forged",
                                    "1-of-1",
                                    "Type",
                                    "1-of-1"
                                  );
                                },
                                className: `motion-button bg-muted/30 rounded-lg border p-3 hover:bg-muted/50 text-left focus-ring hover:scale-[1.02] active:scale-[0.98] ${isActive2 ? "border-foreground/30 bg-foreground/5" : "border-border"}`,
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-medium text-muted-foreground mb-1", children: attr.trait_type }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-foreground", children: attr.value })
                                ]
                              },
                              `forged-1of1-${attr.trait_type}-${attr.value}`
                            );
                          }
                          const layer = project.layers.find(
                            (l) => l.name === attr.trait_type
                          );
                          const trait = layer == null ? void 0 : layer.traits.find(
                            (t) => t.name === attr.value
                          );
                          const isActive = layer && trait ? isTraitActive(layer.id, trait.id) : false;
                          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: (e) => {
                                e.stopPropagation();
                                if (layer && trait) {
                                  toggleTraitFilter(
                                    layer.id,
                                    trait.id,
                                    layer.name,
                                    trait.name
                                  );
                                }
                              },
                              className: `motion-button bg-muted/30 rounded-lg border p-3 hover:bg-muted/50 text-left focus-ring hover:scale-[1.02] active:scale-[0.98] ${isActive ? "border-foreground/30 bg-foreground/5" : "border-border"}`,
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-medium text-muted-foreground mb-1", children: attr.trait_type }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-foreground mb-0.5", children: attr.value }),
                                trait && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-medium text-muted-foreground", children: [
                                  trait.weight.toFixed(1),
                                  "%"
                                ] })
                              ]
                            },
                            `attr-${attr.trait_type}-${attr.value}`
                          );
                        }
                      ) }),
                      activeFilters.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 pt-3 border-t border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          onClick: clearAllFilters,
                          variant: "outline",
                          className: "motion-button w-full h-9 text-xs font-semibold focus-ring",
                          children: "Clear All Filters"
                        }
                      ) })
                    ] })
                  ] }) })
                }
              )
            ]
          }
        )
      }
    )
  ] });
}
export {
  Vault as default
};
