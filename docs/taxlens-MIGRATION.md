# TaxLens design system — migration report

**Shipped:** 2026-05-23 · from the Studio project `taxlens` (Soft Scandinavian, clay)
**Into:** `@taxlens/ui` (`packages/ui`) + preview in `apps/taxlens-web`
**Visual spec (canonical, never edit):** `…/dockito/design-system/projects/taxlens/preview/` — every `NN-*.html` + `_foundation.css`. The HTML is the source of truth; these components are its production sibling.

---

## What this ship did

1. **Re-themed the repo from teal+Fraunces to the clay spec.** The scaffold had landed on a deep-teal palette and Fraunces serif — *not* the design approved in the Studio. Per decision, the theme was rewritten to clay `#C2613A` / paper `#F6F4EF` / Newsreader, expressed as **named Tailwind colours + a `TAXLENS_COLORS` TS object** (matching the repo's existing approach — no CSS-var layer).
2. **Built ~37 components** across primitives, data-display, overlay/feedback, and navigation.
3. **Added every component to the `/preview` storybook-lite** as it was built (21 preview parts, lazy-loaded, grouped Foundation / Primitives / Data / Overlay & Feedback / Navigation).
4. **Swept the feature screens** (landing, income, result, about, how-it-works, input-path-cards, route fallback) from teal to clay.

Verification: `@taxlens/ui` typecheck ✓ lint ✓ · `@taxlens/taxlens-web` typecheck ✓ lint ✓ · production build ✓.

---

## Foundation files touched (re-theme)

| File | Change |
|---|---|
| `packages/ui/src/theme/index.ts` | `TAXLENS_COLORS` → clay system (clay 50–900, paper/edge/ink scales, save/warn/crit/info); added `FONTS` (Newsreader/Inter/JetBrains Mono) + `RADII`. |
| `apps/taxlens-web/tailwind.config.ts` | `theme.extend.colors` → clay named colours; `fontFamily` serif→Newsreader, +mono JetBrains; added `borderRadius` (card/card-lg/ctrl), `letterSpacing`, `boxShadow.pop`, and `keyframes`/`animation` (indet, shimmer, settle). |
| `apps/taxlens-web/src/styles.css` | body bg/ink/font set to direct clay values (avoids a `theme()`-on-nested-DEFAULT PostCSS pitfall). |
| `packages/ui/src/styles.css` | `:root` vars + body → clay. |
| `apps/taxlens-web/index.html` | Google Fonts `<link>`: Fraunces → **Newsreader + JetBrains Mono** (Inter kept). |
| `packages/ui/src/icons/index.ts` | Added domain glyphs (upload, statement, bands, exempt, rate, info, check, done, warn, clear, assist, …) re-exported from lucide-react via `@icons`. |

> The `web` and `admin-web` apps that existed at calibration time were **removed by a concurrent edit** during the ship; only `taxlens-web` remains. No work was lost.

---

## Components generated (~37)

All in `packages/ui/src/`, folder-per-component + `index.ts`, named exports, `forwardRef` on DOM-backed inputs, `cn` from `../../utils/cn.js` (note the `.js` extension — NodeNext style the repo uses). Re-exported from `packages/ui/src/index.ts`.

**Primitives** (`primitives/`)
`AppButton` (re-themed: clay primary, ghost-by-default `danger`, solid `dangerSolid`, link, sizes sm/md/lg, loading/block) · `AppText` (re-themed: Newsreader serif ladder + `lede`) · `Amount` (the ₦ mono-hero idiom) · `Chip` (clay/save/warn/crit/info/sand/paper + dot) · `EstimateBadge` · `Field` + `TextField` + `Textarea` + `Select` · `MoneyField` (the workhorse — ₦ prefix, mono tabular, /mo·/yr suffix) · `ProfilePicker` (signature radio-card) · `Checkbox` · `Switch` · `SegmentedControl` · `HoldToConfirmButton` (1.5s ring fill, reduced-motion aware).

**Data display** (`data/`)
`BandLadder` + `BandSplitBar` (the signature) · `OldVsNew` + `DeltaCallout` · `StatTile` + `ReliefCard` + `ResultCard` · `InflowsTable` (multi-select + running total) · `Donut` + `BarCompare` + `EffectiveRateGauge` · `Stepper` + `ProgressBar` + `Ring` · `Skeleton` + `EmptyState` + `ErrorState` · `Avatar` (the AI mark).

**Overlay & feedback** (`overlay/`)
`Modal` + `CriticalModal` (portal + ESC + backdrop; critical pairs with `HoldToConfirmButton`) · `Tooltip` + `Popover` · `Toast` + `Banner` + `Callout` · `AssistCard` + `CitationBlock` + `MethodologyList` + `ExportRow` + `Disclaimer`.

**Navigation** (`navigation/`)
`TopBar` + `StepRail`.

**Imperative drawer layer** (`overlay/drawer/`) — added 2026-05-23
`DrawerService` (singleton) + `DrawerHost` (mount once) + `ModalHost` / `ToastHost`, backed by a framework-free pub-sub store (`useSyncExternalStore`, no Zustand/context — mirrors the medcord pattern). Mounted in `apps/taxlens-web/src/app.provider.tsx`. Call from anywhere:

```ts
// toasts — auto-dismiss (error is sticky by default); optional Undo
DrawerService.success('Result downloaded');
DrawerService.error('We couldn’t read that PDF');
DrawerService.warning('3 credits unclassified');
DrawerService.info('Switched to yearly');
DrawerService.toast('Reclassified', { onUndo: () => …, duration: 4500 });

// custom modal — pass any component as `body`
const id = DrawerService.showModal({
  title, subtitle, body: <IncomeForm />, size: 'md',
  canClose, clickOutsideClose,
  showConfirmButton, showCancelButton, confirmLabel, cancelLabel,
  destructive, onConfirm, onCancel, onClose,
});
DrawerService.confirm({ title, body, onConfirm });          // primary + cancel
DrawerService.critical({ title, body, onConfirm });         // crimson header + hold-to-confirm
DrawerService.closeModal(id); DrawerService.closeAllModals();
```

Toast tones extended to `success | info | warning | error` (+ `default`, and `save` kept as a `success` alias). Toasts stay calm — dark ink pill with a tinted leading edge + dot, error gets the cold-crimson accent (honours "red is reserved"), no full coloured panels. Modals stack (last-opened on top); `onConfirm` may return a promise (modal closes after it resolves) and its return value is ignored so handlers can call `DrawerService.*` freely. Demo: `/preview` → **Drawer service**.

### Behavioural stance (per ship decision)
Data-display + cards + charts are **pure presentational** — pass pre-formatted values (use `formatNaira` / `parseNairaToKobo` / `NTA_2025_BANDS` from `@taxlens/core`; **no tax math inside components**). Interactive ones (selection, segmented, hold-to-confirm, modal, tooltip) carry real controlled behavior + ARIA. Modal uses a real `createPortal` + ESC/backdrop close (no focus-trap — noted below as remaining work if you want it).

---

## Conventions detected & followed

- **Mixed naming (intentional):** the two pre-existing components keep their `App` prefix (`AppButton`, `AppText`) — renaming them would break the preview parts importing them. **New components are unprefixed** (`MoneyField`, `Chip`, `ResultCard`…), per your call. This is the one deliberate mixed convention in the package.
- Folder-per-component, `index.ts` barrels, named exports only, `interface … extends HTMLAttributes`, `cn(...)` for class composition, arbitrary hex/`var`-free named-colour classes.
- Preview parts use **`meemaw`** (`Repeat`, `Show`) for control flow (no raw `.map` in the JSX-iteration idiom the repo established) and the `PartHeader`/`Scene`/`RefRow` canvas helpers.
- Strict TS (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), `eqeqeq: always`, `no-explicit-any`, `unused-imports: error`, `no-console`.

---

## Skipped (scenes — app code, not library components)

Per the playbook, full scenes are application surfaces, not library building blocks. **Not** rewritten as components; build them in the feature screens from the blocks above. The canonical visual spec for each:

| Scene | Visual spec | Build from |
|---|---|---|
| Landing | `30-landing.html` | `TopBar`, `AppButton`, `ProfilePicker`, the input-path cards |
| Result page | `31-result.html` | `ResultCard`, `BandLadder`/`BandSplitBar`, `StatTile`, `ReliefCard`, `OldVsNew` |
| What changed | `32-what-changed.html` | `OldVsNew`, `DeltaCallout`, `Callout` |
| Ask TaxLens (AI follow-up) | `33-ai-followup.html` | `AssistCard`, `CitationBlock`, `EmptyState` (out-of-scope), `Disclaimer` |
| Command palette (⌘K) | `29-navigation.html` | App feature, not a generic component — skipped. |

The repo's `landing` / `income` / `result` / `about` feature screens are routed shells today; they were re-themed to clay but **not** wired to the new components (out of scope for this ship — see below).

---

## Manual work remaining

- **Wire the feature screens to the new components.** The result/income/landing screens are still placeholder shells. The blocks exist; assembling the scenes is app work.
- **Modal focus-trap.** `Modal`/`CriticalModal` portal + close on ESC/backdrop, but don't trap focus or restore it on close. Add if you want full a11y.
- **Charts are static SVG primitives** sized for the spec's demo numbers; if you need fully data-driven axes/scales, extend them.
- **`MoneyField` is presentational** — it doesn't auto-format keystrokes. Wire `parseNairaToKobo`/`formatNaira` (from `@taxlens/core`) on change in the consuming screen.
- **Repo identity:** workspace fully reads `@taxlens/*` now (was a Solon scaffold at first calibration; rebranded before/during this ship).

---

## Where to look

- **Live preview:** run `taxlens-web`, open `/preview` — every component in every state, grouped in the sidebar.
- **Visual source of truth:** `…/dockito/design-system/projects/taxlens/preview/*.html`.
- **Add a new component to preview:** new `NN-name.tsx` part exporting `XPart` → register in `preview-screen.tsx` PARTS + a `NavItem` in `shared/nav-items.ts`.
