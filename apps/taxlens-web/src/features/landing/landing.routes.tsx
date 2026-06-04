import type { RouteObject } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { LandingScreen } from './screen/landing-screen.tsx';

export const landingRoutes: RouteObject = {
  path: ROUTES.HOME,
  element: <LandingScreen />,
};
