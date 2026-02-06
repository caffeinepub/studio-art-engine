# Specification

## Summary
**Goal:** Fix the previous build failure, significantly reduce the production frontend JavaScript bundle size, and add subtle, performance-friendly motion to a small set of UI components.

**Planned changes:**
- Measure and record the current baseline production JS payload size, then re-measure after changes and document results (including the largest remaining contributors if ~90% reduction is not fully achievable).
- Reduce shipped JS by removing/replacing heavy or unnecessary frontend dependencies, eliminating unused code, and applying route/component-level code-splitting (lazy loading) where it meaningfully reduces initial load.
- Add subtle Tailwind/CSS/React-based motion only to selected UI elements (e.g., buttons, modals, and at least one set of icon buttons) without introducing new animation libraries.
- Ensure the project builds successfully end-to-end (development + production frontend build, and backend canister compilation), and that core navigation and main workflows (Dashboard and project editing) still function.

**User-visible outcome:** The app builds and loads successfully, feels slightly more dynamic (subtle button/modal/icon interactions), and downloads substantially less JavaScript on initial load while preserving existing behavior.
