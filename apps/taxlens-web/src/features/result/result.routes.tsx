import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';

const ResultScreen = lazy(() =>
  import('./screen/result-screen.tsx').then((m) => ({ default: m.ResultScreen })),
);

export const resultRoutes: RouteObject = {
  path: ROUTES.RESULT,
  element: <ResultScreen />,
};
