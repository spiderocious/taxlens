import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';

const LandingScreen = lazy(() =>
  import('./screen/landing-screen.tsx').then((m) => ({ default: m.LandingScreen })),
);

export const landingRoutes: RouteObject = {
  path: ROUTES.HOME,
  element: <LandingScreen />,
};
