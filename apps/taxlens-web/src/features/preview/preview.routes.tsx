import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';

const PreviewScreen = lazy(() =>
  import('./screen/preview-screen.tsx').then((m) => ({ default: m.PreviewScreen })),
);

export const previewRoutes: RouteObject = {
  path: ROUTES.PREVIEW,
  element: <PreviewScreen />,
};
