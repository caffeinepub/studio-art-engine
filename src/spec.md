# Specification

## Summary
**Goal:** Redesign the Projects dashboard to match the GENESIS.ENGINE reference style (image-42.png + provided video) while keeping all existing project actions and behaviors intact.

**Planned changes:**
- Fully replace the layout and visual styling of `frontend/src/pages/Dashboard.tsx` to match the reference: dark, minimal, high-contrast hero/header with large typographic wordmark treatment and subdued supporting copy.
- Redesign the projects grid and tiles to match the reference: large rounded cards, subtle borders/shadows, subdued secondary text, and hover emphasis; add subtle load-in fade/scale.
- Add/keep a dedicated “Start new project” placeholder tile in the grid with dashed outline and centered plus + label that triggers the existing create-project flow.
- Update project tile content to reflect the reference intent using existing data (e.g., protocol/blockchain tag, project name, unit count/collection size, and a created/initialized date derived from `createdAt`).
- Preserve per-project actions (open, settings/edit, delete) and ensure settings/delete do not trigger open (stopPropagation preserved).
- Restyle the create-project and project-settings dialogs invoked from the dashboard to match the new dark/rounded aesthetic using existing shadcn components (no logic/data-shape changes).
- Ensure responsive behavior across mobile/tablet/desktop (single-column stack on small screens; grid with generous spacing on larger screens) without changing existing header/navigation behavior.

**User-visible outcome:** Users see a redesigned GENESIS.ENGINE-style Projects dashboard with a reference-matching hero and tile grid, can start a new project from the placeholder tile, and can still create/open/edit/delete projects with the same behavior as before across all screen sizes.
