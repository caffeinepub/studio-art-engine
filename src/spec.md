# Specification

## Summary
**Goal:** Resolve Pinata directory upload failures, prevent regeneration while a collection is locked for upload, and add a premium interactive mirror/gloss reflection effect to the Dashboard “GENESIS.ENGINE” hero text.

**Planned changes:**
- Fix the Pinata “directory upload” flow to correctly upload multiple files as a wrapped directory and return a directory CID on success.
- Improve Pinata upload error handling to surface HTTP status plus any response body text/JSON in the UI when uploads fail.
- Enforce lock→generate gating: disable “Generate” while the collection is locked and block any generation attempts with a clear message until unlocked.
- Add a subtle, mouse-tracked mirror/gloss highlight overlay on the Dashboard hero text that preserves current text colors and uses gradient masking (light→transparent) with smooth horizontal motion.

**User-visible outcome:** Collection image directory uploads to Pinata succeed under normal conditions (and show actionable error details when they don’t), users cannot regenerate a locked collection until it’s unlocked, and the Dashboard “GENESIS.ENGINE” text has a calm, premium interactive gloss reflection that follows the cursor.
