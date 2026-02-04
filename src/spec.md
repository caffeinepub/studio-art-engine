# Specification

## Summary
**Goal:** Make Vault NFT collection generation reliable and responsive for large runs (10k–20k) by chunking work, progressively committing results, and adding progress/cancel plus rendering safeguards.

**Planned changes:**
- Update Vault collection generation to run in batches and yield to the UI/event loop between batches to prevent long freezes on large runs.
- Implement progressive commit: clear `project.generatedNFTs` at the start of a run, then append newly generated NFTs to the project after each batch via `onUpdateProject`; keep final sorting by token id and update `lastGeneratedAt`.
- Add in-generation progress UI showing both percentage and numeric count (e.g., “3,250 / 10,000”), plus a Cancel button visible only during generation that stops within one batch and leaves already-generated NFTs intact.
- Add an optional (default off) low-memory/headless mode toggle in Vault generation controls to suppress expensive live rendering during generation and restore normal rendering on finish/cancel.
- Add Vault rendering safeguards for very large `generatedNFTs` lists so generation and large lists don’t lock the UI (e.g., avoid rendering thousands of thumbnails during generation and/or show a lightweight “Generating…” view).
- Preserve deterministic behavior and existing constraints: rule validation (exclude/force), DNA uniqueness across batches, forged token integration/reserved token numbers, and existing partial-completion warning behavior when max attempts is reached.

**User-visible outcome:** Users can generate very large NFT collections in Vault while the browser stays responsive, see live progress, cancel safely mid-run, optionally use a low-memory mode for reliability, and avoid UI lockups during/after generation.
