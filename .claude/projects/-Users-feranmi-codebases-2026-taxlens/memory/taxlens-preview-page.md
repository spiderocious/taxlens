---
name: taxlens-preview-page
description: How the /preview design-system page works and how to add to it
metadata:
  type: project
---

`apps/taxlens-web` has a Storybook-lite design-system preview at route `/preview` (registry pattern, modeled on pracket-web's preview feature).

Structure: `src/features/preview/` → `preview.routes.tsx` (lazy), `shared/nav-items.ts` (NAV_ITEMS registry + NAV_GROUPS), `screen/preview-screen.tsx` (PARTS lazy-map dispatcher + sidebar), `screen/parts/` (`NN-name.tsx` parts + `preview-canvas.tsx` helpers `PartHeader`/`Scene`/`RefRow` + `preview-sidebar.tsx`).

To add a primitive preview: (1) add `NN-name.tsx` exporting a `XxxPart` component that imports the **real** `@taxlens/ui` primitive, (2) add a `PARTS` entry in `preview-screen.tsx`, (3) add a `NavItem` in `shared/nav-items.ts`. The convention (docs/rules.md) requires a preview part whenever a new `@taxlens/ui` primitive is added. See [[taxlens-workspace]].
