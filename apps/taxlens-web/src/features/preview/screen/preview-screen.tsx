import { lazy, Suspense, useState, type LazyExoticComponent } from 'react';
import { Show } from 'meemaw';

import { PreviewSidebar } from './parts/preview-sidebar.tsx';

// Registry-based dispatcher (à la Storybook). Each part is lazy-loaded so the
// preview never ships in the main app bundle. Adding a primitive preview = add
// a part file, a PARTS entry, and a NavItem in shared/nav-items.ts.
const PARTS: Record<string, LazyExoticComponent<() => React.ReactElement>> = {
  palette: lazy(() => import('./parts/01-palette.tsx').then((m) => ({ default: m.PalettePart }))),
  type: lazy(() => import('./parts/02-type.tsx').then((m) => ({ default: m.TypePart }))),
  buttons: lazy(() => import('./parts/10-buttons.tsx').then((m) => ({ default: m.ButtonsPart }))),
  text: lazy(() => import('./parts/11-text.tsx').then((m) => ({ default: m.TextPart }))),
};

export function PreviewScreen() {
  const [activeId, setActiveId] = useState('palette');
  const ActivePart = PARTS[activeId];

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <PreviewSidebar activeId={activeId} onSelect={setActiveId} />
      <main className="overflow-y-auto px-8 py-10">
        <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
          <Show when={ActivePart !== undefined} fallback={<p className="text-sm">Coming soon.</p>}>
            {ActivePart ? <ActivePart /> : null}
          </Show>
        </Suspense>
      </main>
    </div>
  );
}
