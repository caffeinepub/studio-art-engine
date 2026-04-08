import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, E as Primitive, n as cn, D as Dialog, M as DialogTrigger, B as Button, a as DialogContent, b as DialogHeader, d as DialogTitle, e as DialogDescription, L as Label, I as Input, N as Plus, T as Trash2, S as Switch, u as ue } from "./index-pc9VbM7E.js";
import { A as Alert, T as TriangleAlert, a as AlertDescription, v as validatePinataKey, d as buildMetadataPreview, L as LoaderCircle, C as CircleCheck, c as CircleX } from "./pinata-L-R8UZ9G.js";
import { S as ScrollArea } from "./scroll-area-D32bQ35H.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-DTc9TCj-.js";
import "./index-BHuraKdI.js";
import "./chevron-down-D7GD2-2C.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", key: "1u773s" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
const CircleHelp = createLucideIcon("circle-help", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "M10 14 21 3", key: "gplh6r" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
];
const ExternalLink = createLucideIcon("external-link", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 16v-4", key: "1dtifu" }],
  ["path", { d: "M12 8h.01", key: "e9boi3" }]
];
const Info = createLucideIcon("info", __iconNode);
var NAME = "Separator";
var DEFAULT_ORIENTATION = "horizontal";
var ORIENTATIONS = ["horizontal", "vertical"];
var Separator$1 = reactExports.forwardRef((props, forwardedRef) => {
  const { decorative, orientation: orientationProp = DEFAULT_ORIENTATION, ...domProps } = props;
  const orientation = isValidOrientation(orientationProp) ? orientationProp : DEFAULT_ORIENTATION;
  const ariaOrientation = orientation === "vertical" ? orientation : void 0;
  const semanticProps = decorative ? { role: "none" } : { "aria-orientation": ariaOrientation, role: "separator" };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Primitive.div,
    {
      "data-orientation": orientation,
      ...semanticProps,
      ...domProps,
      ref: forwardedRef
    }
  );
});
Separator$1.displayName = NAME;
function isValidOrientation(orientation) {
  return ORIENTATIONS.includes(orientation);
}
var Root = Separator$1;
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root,
    {
      "data-slot": "separator",
      decorative,
      orientation,
      className: cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      ),
      ...props
    }
  );
}
function PinataKeyGuideDialog() {
  const [open, setOpen] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "outline",
        size: "sm",
        className: "w-full justify-start gap-2 h-8 text-xs transition-all duration-hover ease-apple",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleHelp, { className: "h-3.5 w-3.5" }),
          "How to get your JWT token"
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Getting your Pinata JWT token" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Follow these steps to get the correct credential" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-[calc(85vh-8rem)] pr-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { className: "border-amber-500/50 bg-amber-500/10 animate-fade-in-scale", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-amber-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDescription, { className: "text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "Important:" }),
            " Pinata shows three fields when you create an API key. You must copy the",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "JWT (secret access token)" }),
            " ",
            "field — the other two fields (API Key and API Secret) will not work in this app."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground", children: "What is Pinata?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: "Pinata is an IPFS pinning service that stores your NFT images and metadata permanently on the decentralized web. This app uses Pinata to upload your collection so it can be accessed from anywhere." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold", children: "1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-foreground", children: "Create a Pinata account" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: [
              "Go to",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: "https://pinata.cloud",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "text-primary hover:underline inline-flex items-center gap-1 transition-all duration-hover ease-apple",
                  children: [
                    "pinata.cloud",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
                  ]
                }
              ),
              " ",
              "and sign up for a free account. If you already have an account, just log in."
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold", children: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-foreground", children: "Navigate to API Keys" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: [
              "After logging in, find ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "API Keys" }),
              " in the left sidebar menu and click it."
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold", children: "3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-foreground", children: "Create a new API key" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: [
              "Click the ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: '"New Key"' }),
              ` button. Give it a descriptive name like "NFT Collection App" so you remember what it's for.`
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold", children: "4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-foreground", children: "Copy the JWT (secret access token)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: [
              "Pinata will show you a popup with",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "three fields" }),
              ":"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/50 border border-border rounded-md p-3 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-mono text-muted-foreground flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground mb-1", children: "API Key" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px]", children: "c3e55bbe16edb9de49b4" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-red-500 font-semibold", children: "❌ Don't use" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-mono text-muted-foreground flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground mb-1", children: "API Secret" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px]", children: "f5359825dd345e08d238570496..." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-red-500 font-semibold", children: "❌ Don't use" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-mono text-muted-foreground flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-green-600 dark:text-green-400 mb-1", children: "JWT (secret access token)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px]", children: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-green-600 dark:text-green-400 font-semibold", children: "✓ Copy this!" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { className: "border-green-500/50 bg-green-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDescription, { className: "text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "Only the JWT token will work." }),
              " ",
              `The API Key and API Secret fields are for Pinata's legacy REST API and will show as "not valid" if you paste them into this app.`
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: [
              "Copy the ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "entire JWT token" }),
              " (it's very long, usually 200+ characters). You won't be able to see it again after closing the popup!"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold", children: "5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold text-foreground", children: "Paste it into Settings" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: [
              "Return to the Settings page and paste your JWT token into the",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: ' "Pinata JWT (secret access token)"' }),
              " field. The app will automatically validate it and show a green checkmark if it's correct."
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground", children: "How this app uses your JWT" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Security:" }),
                " Your JWT is stored locally in your browser and never sent to any server except Pinata."
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "When it's used:" }),
                " After you lock your collection in the Vault and click Upload, the app uses your JWT to upload images and metadata to IPFS via Pinata."
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "What you get:" }),
                " After upload completes, you can export your collection with permanent IPFS URIs (ipfs://...) ready for minting."
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Good to know" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "•" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Pinata's free plan includes 1 GB of storage, which works for most NFT collections" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "•" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "You can view all your uploaded files on the Pinata dashboard" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "•" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "If you lose your JWT, you can create a new API key anytime" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "•" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Keep your JWT private — treat it like a password" })
            ] })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
function Textarea({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "textarea",
    {
      "data-slot": "textarea",
      className: cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      ),
      ...props
    }
  );
}
function usePinataKeyValidation(apiKey) {
  const [status, setStatus] = reactExports.useState("idle");
  const [message, setMessage] = reactExports.useState("");
  const debounceTimer = reactExports.useRef(null);
  const abortController = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }
    if (!apiKey || apiKey.trim().length === 0) {
      setStatus("idle");
      setMessage("");
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      setStatus("checking");
      setMessage("Validating JWT token...");
      abortController.current = new AbortController();
      try {
        const result = await validatePinataKey(apiKey);
        if (result.valid) {
          setStatus("valid");
          setMessage(result.message);
        } else {
          setStatus("invalid");
          setMessage(result.message);
        }
      } catch (_error) {
        setStatus("invalid");
        setMessage("Could not validate JWT token");
      }
    }, 800);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [apiKey]);
  return { status, message };
}
function Settings({ project, onUpdateProject }) {
  const [localSettings, setLocalSettings] = reactExports.useState(project.settings);
  const { status: keyValidationStatus, message: keyValidationMessage } = usePinataKeyValidation(localSettings.pinataApiKey || "");
  const updateSetting = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdateProject((p) => ({
      ...p,
      settings: newSettings
    }));
  };
  const updateMetadataFormat = (format) => {
    const blockchainMap = {
      solana: "SOL",
      ethereum: "ETH",
      polygon: "POLYGON",
      bnb: "BNB",
      base: "BASE",
      icp: "ICP"
    };
    const newBlockchain = blockchainMap[format];
    const newSettings = { ...localSettings, metadataFormat: format };
    setLocalSettings(newSettings);
    onUpdateProject((p) => ({
      ...p,
      blockchain: newBlockchain,
      settings: newSettings
    }));
  };
  const addCreator = () => {
    const currentCreators = localSettings.solanaCreators || [];
    const newCreators = [...currentCreators, { address: "", share: 0 }];
    updateSetting("solanaCreators", newCreators);
  };
  const removeCreator = (index) => {
    const currentCreators = localSettings.solanaCreators || [];
    if (currentCreators.length <= 1) {
      ue.error("At least one creator is required");
      return;
    }
    const newCreators = currentCreators.filter((_, i) => i !== index);
    updateSetting("solanaCreators", newCreators);
  };
  const updateCreator = (index, field, value) => {
    const currentCreators = localSettings.solanaCreators || [];
    const newCreators = [...currentCreators];
    if (field === "address") {
      newCreators[index] = { ...newCreators[index], address: String(value) };
    } else if (field === "share") {
      const numValue = Math.max(
        0,
        Math.min(100, Number.parseInt(String(value)) || 0)
      );
      newCreators[index] = { ...newCreators[index], share: numValue };
    }
    updateSetting("solanaCreators", newCreators);
  };
  const creatorsValidation = reactExports.useMemo(() => {
    if (project.blockchain !== "SOL") {
      return { valid: true, message: "" };
    }
    const creators = localSettings.solanaCreators || [];
    if (creators.length === 0) {
      return { valid: false, message: "At least one creator is required" };
    }
    const totalShare = creators.reduce((sum, c) => sum + c.share, 0);
    if (totalShare !== 100) {
      return {
        valid: false,
        message: `Total share must equal 100% (currently ${totalShare}%)`
      };
    }
    const hasEmptyAddress = creators.some(
      (c) => !c.address || c.address.trim().length === 0
    );
    if (hasEmptyAddress) {
      return { valid: false, message: "All creator addresses must be filled" };
    }
    return { valid: true, message: "Creators configuration is valid" };
  }, [localSettings.solanaCreators, project.blockchain]);
  const metadataPreview = reactExports.useMemo(() => {
    return buildMetadataPreview(project.name, project.symbol, localSettings, 1);
  }, [project.name, project.symbol, localSettings]);
  const getPublishingStatus = () => {
    const hasKey = localSettings.pinataApiKey && localSettings.pinataApiKey.trim().length > 0;
    const hasGenerated = project.generatedNFTs.length > 0;
    const isLocked = project.collectionLocked;
    const publishingState = project.ipfsPublishing;
    const creatorsValid = creatorsValidation.valid;
    if (!hasKey) {
      return {
        step: 1,
        message: "Add your Pinata JWT token below to get started",
        color: "text-muted-foreground"
      };
    }
    if (project.blockchain === "SOL" && !creatorsValid) {
      return {
        step: 2,
        message: creatorsValidation.message,
        color: "text-amber-600 dark:text-amber-400"
      };
    }
    if (!hasGenerated) {
      return {
        step: 3,
        message: "Go to Vault and generate your collection",
        color: "text-blue-500"
      };
    }
    if (!isLocked) {
      return {
        step: 4,
        message: "Review your collection in Vault, then lock it to enable upload",
        color: "text-blue-500"
      };
    }
    if ((publishingState == null ? void 0 : publishingState.status) === "uploading") {
      return {
        step: 5,
        message: `Uploading to IPFS... ${publishingState.uploadProgress || 0}%`,
        color: "text-blue-500"
      };
    }
    if ((publishingState == null ? void 0 : publishingState.status) === "uploaded") {
      return {
        step: 6,
        message: "Upload complete! Your collection is ready to export",
        color: "text-green-500"
      };
    }
    if ((publishingState == null ? void 0 : publishingState.status) === "upload-failed") {
      return {
        step: 5,
        message: `Upload failed. ${publishingState.errorMessage || "Please try again"}`,
        color: "text-red-500"
      };
    }
    return {
      step: 5,
      message: "Ready to upload! Go to Vault to start the upload",
      color: "text-green-500"
    };
  };
  const publishingStatus = getPublishingStatus();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex flex-col bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-r border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-4 border-b border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Project settings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Configure metadata and IPFS publishing" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-6 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { className: "border-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `text-sm font-medium ${publishingStatus.color}`,
              children: [
                "Step ",
                publishingStatus.step,
                " of 6"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground", children: publishingStatus.message })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/30 border border-border rounded-lg p-4 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground", children: "How it works" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5", children: "1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Add your Pinata JWT (secret access token) in the field below" })
            ] }),
            project.blockchain === "SOL" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5", children: "2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Configure Solana creators with wallet addresses and share percentages" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5", children: project.blockchain === "SOL" ? "3" : "2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Go to Workshop and create your layers and traits" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5", children: project.blockchain === "SOL" ? "4" : "3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Go to Vault and click Generate to create your collection" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5", children: project.blockchain === "SOL" ? "5" : "4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Review your collection and click Lock when you're happy with it" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5", children: project.blockchain === "SOL" ? "6" : "5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Click Upload to automatically upload everything to IPFS via Pinata" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5", children: project.blockchain === "SOL" ? "7" : "6" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Export your collection with complete IPFS links ready to use" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "my-6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pinata-api-key", className: "text-sm font-medium", children: "Pinata JWT (secret access token)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "pinata-api-key",
              type: "password",
              value: localSettings.pinataApiKey || "",
              onChange: (e) => updateSetting("pinataApiKey", e.target.value),
              placeholder: "Paste your Pinata JWT token here",
              className: "h-9 font-mono text-xs"
            }
          ),
          keyValidationStatus !== "idle" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
            keyValidationStatus === "checking" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin text-blue-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: keyValidationMessage })
            ] }),
            keyValidationStatus === "valid" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-green-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-600 dark:text-green-400", children: keyValidationMessage })
            ] }),
            keyValidationStatus === "invalid" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5 text-red-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-600 dark:text-red-400", children: keyValidationMessage })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { className: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-4 w-4 text-blue-600 dark:text-blue-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDescription, { className: "text-xs text-blue-800 dark:text-blue-300 ml-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Note:" }),
              " Pinata's free plan is suitable for small to medium-sized collections. For large collections, you may need to upgrade to a paid Pinata plan to ensure sufficient storage and bandwidth."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PinataKeyGuideDialog, {})
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "my-6" }),
        project.blockchain === "SOL" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: "Solana creators" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Configure creator wallet addresses and royalty shares" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  onClick: addCreator,
                  variant: "outline",
                  size: "sm",
                  className: "h-8 px-3 text-xs focus-ring",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3.5 h-3.5 mr-1" }),
                    "Add"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: (localSettings.solanaCreators || []).map(
              (creator, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-lg",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          value: creator.address,
                          onChange: (e) => updateCreator(
                            index,
                            "address",
                            e.target.value
                          ),
                          placeholder: "Wallet address",
                          className: "h-8 text-xs font-mono"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Input,
                          {
                            type: "number",
                            value: creator.share,
                            onChange: (e) => updateCreator(
                              index,
                              "share",
                              e.target.value
                            ),
                            placeholder: "Share %",
                            min: "0",
                            max: "100",
                            className: "h-8 text-xs w-24"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "%" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        onClick: () => removeCreator(index),
                        variant: "ghost",
                        size: "icon",
                        className: "h-8 w-8 flex-shrink-0 focus-ring",
                        disabled: (localSettings.solanaCreators || []).length <= 1,
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3.5 h-3.5" })
                      }
                    )
                  ]
                },
                creator.address || `creator-${index}`
              )
            ) }),
            !creatorsValidation.valid && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5 text-amber-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-amber-600 dark:text-amber-400", children: creatorsValidation.message })
            ] }),
            creatorsValidation.valid && (localSettings.solanaCreators || []).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-green-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-600 dark:text-green-400", children: creatorsValidation.message })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "my-6" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "output-size", className: "text-sm font-medium", children: "Dimensions (px)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "output-size",
              type: "number",
              value: localSettings.outputSize,
              onChange: (e) => updateSetting(
                "outputSize",
                Math.max(
                  100,
                  Math.min(4096, Number.parseInt(e.target.value) || 800)
                )
              ),
              min: "100",
              max: "4096",
              className: "h-9"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Square output size (width × height)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "format", className: "text-sm font-medium", children: "Format" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: "same", onValueChange: () => {
          }, disabled: true, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "same", children: "Same as assets" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "my-6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "format-preset", className: "text-sm font-medium", children: "Metadata format" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: localSettings.metadataFormat,
              onValueChange: (value) => {
                if (value === "icp") return;
                updateMetadataFormat(value);
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ethereum", children: "Ethereum (ERC-721)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "polygon", children: "Polygon (ERC-721)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "base", children: "Base (ERC-721)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "bnb", children: "BNB Chain (BEP-721)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "solana", children: "Solana (Metaplex)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "icp", disabled: true, children: "ICP (coming soon)" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Label,
            {
              htmlFor: "token-name-template",
              className: "text-sm font-medium",
              children: "Token name template"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "token-name-template",
              value: localSettings.tokenNameTemplate,
              onChange: (e) => updateSetting("tokenNameTemplate", e.target.value),
              placeholder: "{{collection}} #{{id}}",
              className: "h-9"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Use ",
            "{{collection}}",
            " and ",
            "{{id}}",
            " as placeholders"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Label,
            {
              htmlFor: "token-description",
              className: "text-sm font-medium",
              children: "Token description"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "token-description",
              value: localSettings.tokenDescription,
              onChange: (e) => updateSetting("tokenDescription", e.target.value),
              placeholder: "A short description for tokens...",
              className: "min-h-[80px] resize-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Label,
            {
              htmlFor: "start-at-zero",
              className: "text-sm font-medium cursor-pointer",
              children: "Start token number at 0"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Switch,
            {
              id: "start-at-zero",
              checked: localSettings.startTokenNumberAtZero,
              onCheckedChange: (checked) => updateSetting("startTokenNumberAtZero", checked)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, { className: "my-6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "royalties", className: "text-sm font-medium", children: "Royalties %" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "royalties",
              type: "number",
              value: localSettings.royaltiesPercent,
              onChange: (e) => updateSetting(
                "royaltiesPercent",
                Math.max(
                  0,
                  Math.min(100, Number.parseFloat(e.target.value) || 0)
                )
              ),
              min: "0",
              max: "100",
              step: "0.1",
              className: "h-9"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-4 border-b border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-foreground", children: "Preview" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Live preview of exported metadata" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-card border border-border rounded-lg p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs text-foreground font-mono overflow-x-auto", children: JSON.stringify(metadataPreview, null, 2) }) }) })
    ] })
  ] }) }) });
}
export {
  Settings as default
};
