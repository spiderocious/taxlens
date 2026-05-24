import type { RouteObject } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { AboutScreen } from './screen/about-screen.tsx';
import { HowItWorksScreen } from './screen/how-it-works-screen.tsx';

export const aboutRoutes: RouteObject[] = [
  { path: ROUTES.HOW_IT_WORKS, element: <HowItWorksScreen /> },
  { path: ROUTES.ABOUT, element: <AboutScreen /> },
];
