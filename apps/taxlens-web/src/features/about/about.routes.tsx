import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';

const HowItWorksScreen = lazy(() =>
  import('./screen/how-it-works-screen.tsx').then((m) => ({ default: m.HowItWorksScreen })),
);
const AboutScreen = lazy(() =>
  import('./screen/about-screen.tsx').then((m) => ({ default: m.AboutScreen })),
);

export const aboutRoutes: RouteObject[] = [
  { path: ROUTES.HOW_IT_WORKS, element: <HowItWorksScreen /> },
  { path: ROUTES.ABOUT, element: <AboutScreen /> },
];
