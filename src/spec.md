# Specification

## Summary
**Goal:** Ensure Forge “Direct Injection” uploads are processed (square PNG at configured output size, with optional pixel mode) and that the processed result is what gets stored and uploaded to Pinata/IPFS.

**Planned changes:**
- Process Direct Injection uploads into a new square PNG at `project.settings.outputSize x project.settings.outputSize` before saving into project state.
- When `project.pixelArtMode` is enabled, apply pixel-mode processing by rendering with canvas image smoothing disabled.
- Persist only the processed image data in long-lived project state (discard the original, unprocessed upload bytes/dimensions).
- Ensure the IPFS/Pinata upload pipeline uses the processed Forge-derived `imageData` for `project.generatedNFTs` when uploading collections.

**User-visible outcome:** Directly injected Forge images display and export/upload exactly as shown in the app (correct dimensions and pixel mode when enabled), and Pinata receives only the processed versions.
