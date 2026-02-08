# Specification

## Summary
**Goal:** Update the Pinata/IPFS publishing workflow to use industry-standard directory uploads for images and per-token metadata (with correct token URI formatting), enforce 1-based filenames, respect configured export dimensions, and lock assets to prevent regeneration during publishing.

**Planned changes:**
- Change the upload flow to perform two Pinata directory uploads: (1) upload the images folder to get `IMAGES_FOLDER_CID`, then (2) generate per-token metadata JSON files referencing `ipfs://IMAGES_FOLDER_CID/<TOKEN_ID>.png` and upload the metadata folder to get `METADATA_FOLDER_CID`.
- Fix Pinata directory upload `FormData` construction so each uploaded file includes its intended path/filename (via `formData.append('file', blob, <path>)`), ensuring metadata is uploaded as many files (`1.json`, `2.json`, …) rather than merged into one.
- Enforce 1-based sequential filenames for both images (`1.png..N.png`) and metadata (`1.json..N.json`) throughout export and upload (no `0.*`).
- Implement asset locking behavior so when `project.collectionLocked` is true, the Vault “Generate” action (and any regeneration actions) are disabled until the collection is unlocked, without changing the existing layout.
- Ensure exported and uploaded images use the exact pixel dimensions configured in Settings, and that all uploaded images share identical dimensions.
- Keep the existing Lock → Upload → Unlock control flow, but update status/output text (in English) to show both returned CIDs and the final token URI pattern `ipfs://METADATA_FOLDER_CID/<TOKEN_ID>.json`.

**User-visible outcome:** Users can lock a collection, upload images and per-token metadata to Pinata as two directory uploads, see both resulting CIDs plus the final token URI format, and are prevented from regenerating the collection while it is locked; exported/uploaded images match the configured Settings dimensions.
