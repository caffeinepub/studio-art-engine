# Specification

## Summary
**Goal:** Fix the Pinata directory upload flow so generated NFT collections (images + metadata) upload successfully without the HTTP 400 “More than one file and/or directory was provided for pinning.” error, while preserving JWT Bearer auth and existing diagnostics.

**Planned changes:**
- Update the multipart/form-data payload sent to `https://api.pinata.cloud/pinning/pinFileToIPFS` so Pinata receives the files as a single directory upload (not interpreted as multiple separate roots), keeping `Authorization: Bearer <JWT>`.
- Ensure the returned directory CIDs are used to construct correct `ipfs://` URIs in generated metadata, including correct relative paths and no changes to existing token numbering behavior (e.g., `startTokenNumberAtZero`).
- Preserve/ensure UI error reporting includes both HTTP status code and response body text (when available) when an upload fails.

**User-visible outcome:** From the Vault publishing flow, a typical generated collection uploads to Pinata successfully and returns a directory CID for images and a CID for metadata, with metadata image links resolving correctly; if an upload fails, the UI shows the status code and response body for troubleshooting.
