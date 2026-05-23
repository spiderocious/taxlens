import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';

const IncomeScreen = lazy(() =>
  import('./screen/income-screen.tsx').then((m) => ({ default: m.IncomeScreen })),
);

export const incomeRoutes: RouteObject = {
  path: ROUTES.INCOME,
  element: <IncomeScreen />,
};
