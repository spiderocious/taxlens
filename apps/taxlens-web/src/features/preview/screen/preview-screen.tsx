import { lazy, Suspense, useState, type LazyExoticComponent } from 'react';
import { Show } from 'meemaw';

import { PreviewSidebar } from './parts/preview-sidebar.tsx';

// Registry-based dispatcher (à la Storybook). Each part is lazy-loaded so the
// preview never ships in the main app bundle. Adding a primitive preview = add
// a part file, a PARTS entry, and a NavItem in shared/nav-items.ts.
const PARTS: Record<string, LazyExoticComponent<() => React.ReactElement>> = {
  // Foundation
  palette: lazy(() => import('./parts/01-palette.tsx').then((m) => ({ default: m.PalettePart }))),
  type: lazy(() => import('./parts/02-type.tsx').then((m) => ({ default: m.TypePart }))),
  // Primitives
  buttons: lazy(() => import('./parts/10-buttons.tsx').then((m) => ({ default: m.ButtonsPart }))),
  text: lazy(() => import('./parts/11-text.tsx').then((m) => ({ default: m.TextPart }))),
  amount: lazy(() => import('./parts/12-amount.tsx').then((m) => ({ default: m.AmountPart }))),
  chips: lazy(() => import('./parts/13-chips.tsx').then((m) => ({ default: m.ChipsPart }))),
  inputs: lazy(() => import('./parts/14-inputs.tsx').then((m) => ({ default: m.InputsPart }))),
  selection: lazy(() => import('./parts/15-selection.tsx').then((m) => ({ default: m.SelectionPart }))),
  hold: lazy(() => import('./parts/16-hold-to-confirm.tsx').then((m) => ({ default: m.HoldToConfirmPart }))),
  // Data display
  bands: lazy(() => import('./parts/20-bands.tsx').then((m) => ({ default: m.BandsPart }))),
  comparison: lazy(() => import('./parts/21-comparison.tsx').then((m) => ({ default: m.ComparisonPart }))),
  table: lazy(() => import('./parts/22-table.tsx').then((m) => ({ default: m.TablePart }))),
  charts: lazy(() => import('./parts/23-charts.tsx').then((m) => ({ default: m.ChartsPart }))),
  progress: lazy(() => import('./parts/24-progress.tsx').then((m) => ({ default: m.ProgressPart }))),
  cards: lazy(() => import('./parts/25-cards.tsx').then((m) => ({ default: m.CardsPart }))),
  states: lazy(() => import('./parts/26-states.tsx').then((m) => ({ default: m.StatesPart }))),
  avatar: lazy(() => import('./parts/27-avatar.tsx').then((m) => ({ default: m.AvatarPart }))),
  // Overlay & feedback
  modals: lazy(() => import('./parts/30-modals.tsx').then((m) => ({ default: m.ModalsPart }))),
  tooltip: lazy(() => import('./parts/31-tooltip.tsx').then((m) => ({ default: m.TooltipPart }))),
  feedback: lazy(() => import('./parts/32-feedback.tsx').then((m) => ({ default: m.FeedbackPart }))),
  cross: lazy(() => import('./parts/33-cross.tsx').then((m) => ({ default: m.CrossPart }))),
  drawer: lazy(() => import('./parts/34-drawer-service.tsx').then((m) => ({ default: m.DrawerServicePart }))),
  // Navigation
  nav: lazy(() => import('./parts/40-nav.tsx').then((m) => ({ default: m.NavPart }))),
};

export function PreviewScreen() {
  const [activeId, setActiveId] = useState('palette');
  const ActivePart = PARTS[activeId];

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <PreviewSidebar activeId={activeId} onSelect={setActiveId} />
      <main className="overflow-y-auto px-8 py-10">
        <Suspense fallback={<div className="text-sm text-ink-muted">Loading…</div>}>
          <Show when={ActivePart !== undefined} fallback={<p className="text-sm">Coming soon.</p>}>
            {ActivePart ? <ActivePart /> : null}
          </Show>
        </Suspense>
      </main>
    </div>
  );
}
