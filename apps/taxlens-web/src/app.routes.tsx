import { Suspense } from 'react';
import { useRoutes, type RouteObject } from 'react-router-dom';

import { aboutRoutes } from '@features/about/about.routes.tsx';
import { incomeRoutes } from '@features/income/income.routes.tsx';
import { landingRoutes } from '@features/landing/landing.routes.tsx';
import { previewRoutes } from '@features/preview/preview.routes.tsx';
import { resultRoutes } from '@features/result/result.routes.tsx';

const routes: RouteObject[] = [
  landingRoutes,
  incomeRoutes,
  ...resultRoutes,
  ...aboutRoutes,
  previewRoutes,
  // Unknown paths fall back to the landing screen.
  { path: '*', element: landingRoutes.element },
];

function PageFallback() {
  return (
    <div role="status" className="px-6 py-16 text-sm text-ink-muted">
      Loading…
    </div>
  );
}

export function AppRoutes() {
  const element = useRoutes(routes);
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}
