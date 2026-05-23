---
name: taxlens-preview-page
description: How the /preview design-system page works and how to add to it
metadata:
  type: project
---

`apps/taxlens-web` has a Storybook-lite design-system preview at route `/preview` (registry pattern, modeled on pracket-web's preview feature).

Structure: `src/features/preview/` → `preview.routes.tsx` (lazy), `shared/nav-items.ts` (NAV_ITEMS registry + NAV_GROUPS), `screen/preview-screen.tsx` (PARTS lazy-map dispatcher + sidebar), `screen/parts/` (`NN-name.tsx` parts + `preview-canvas.tsx` helpers `PartHeader`/`Scene`/`RefRow` + `preview-sidebar.tsx`).

To add a primitive preview: (1) add `NN-name.tsx` exporting a `XxxPart` component that imports the **real** `@taxlens/ui` primitive, (2) add a `PARTS` entry in `preview-screen.tsx`, (3) add a `NavItem` in `shared/nav-items.ts`. The convention (docs/rules.md) requires a preview part whenever a new `@taxlens/ui` primitive is added.

`@taxlens/ui` is a full design system (clay-on-paper Scandinavian; Newsreader serif for the calm "thinking"/AI voice, Inter sans chrome, JetBrains mono for every ₦ figure). Token source of truth = `packages/ui/src/theme/index.ts` (TAXLENS_COLORS clay/paper/edge/ink/save/warn/crit/info + FONTS + RADII), mirrored into `apps/taxlens-web/tailwind.config.ts`. Components span `primitives/` (amount, money-field, chip, field, segmented-control, selection, profile-picker, estimate-badge, hold-to-confirm-button, app-button, app-text), `data/` (band-ladder, comparison, charts, inflows-table, cards, progress, states, avatar), `overlay/` (modal, drawer-service, tooltip, feedback, cross), `navigation/` (nav). Visual specs live in `design-system/projects/taxlens/preview/*.html`. The `/preview` page has ~24 parts covering all of them. See [[taxlens-workspace]].
