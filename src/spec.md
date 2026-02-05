# Specification

## Summary
**Goal:** Apply an app-wide Apple HIG–inspired UI/UX refinement pass (visual theme, interaction feedback, motion, and copy) across all existing sections while preserving the current layout and navigation structure.

**Planned changes:**
- Introduce a coherent, shared surface + typography system (translucent backgrounds, consistent cards/popovers/borders, premium type hierarchy) applied across Dashboard, Workshop, Rarity, Rules, Preview, Forge, Vault, and Settings without altering page structure.
- Unify interaction feedback and motion behavior using existing motion tokens/easing for consistent hover/press/focus/disabled/loading states across buttons, cards, nav items, dialogs, and toggles, respecting prefers-reduced-motion.
- Standardize user-facing copy to a calm, premium English tone (replace ALL-CAPS labels/toasts/buttons with consistent sentence/title case) without changing behaviors.
- Polish global navigation/header responsiveness: stable alignment, consistent active states, improved spacing, and mobile menu interactions/tap targets with consistent feedback.
- Refine page-specific UI polish while keeping all existing flows intact:
  - Dashboard: project cards and dialogs (New Project / Project Settings) spacing, hierarchy, and feedback; intentional empty state.
  - Workshop: sidebar layers list and trait cards affordances/spacing/typography; consistent empty states.
  - Preview: align custom frame/button/toggle styling with global tokens; clear generate loading/disabled feedback; readable pixel mode toggle row.
  - Forge: consistent modal/panel surfaces, tabs, selection states, and action feedback; avoid hover-only affordances on mobile.
  - Vault: reduce clutter and improve readability across toolbar/filters/grid/detail modal/progress; consistent card states across view modes and breakpoints.
  - Settings: consistent section styling and form control states; readable metadata preview panel code styling.

**User-visible outcome:** The app retains the same pages, navigation, and workflows, but looks and feels consistently “Apple HIG–style” across the entire UI with unified typography, surfaces, motion/feedback states, and calmer English copy.
