# Specification

## Summary
**Goal:** Get the project building cleanly again and remove unused/redundant code and files without changing current app behavior.

**Planned changes:**
- Retry the full build and fix any issues preventing successful compilation, ensuring no TypeScript build errors and no runtime crash/blank screen on initial load.
- Repo-wide cleanup to remove unused/redundant files, imports, exports, types, and dead code paths while preserving existing core flows (project creation, layer/trait workshop, rules, preview, vault generation/export, settings, Pinata/IPFS publishing, and localStorage persistence).
- Targeted cleanup of unused persistence/query/backend-storage scaffolding and placeholder modules; trim unreferenced backend code while keeping a single Motoko actor in `backend/main.mo`.

**User-visible outcome:** The app loads to the Dashboard without crashing, and all existing functionality behaves the same, with a leaner codebase and no broken references.
