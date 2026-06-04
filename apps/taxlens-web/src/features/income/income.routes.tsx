import type { RouteObject } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { IncomeScreen } from './screen/income-screen.tsx';

export const incomeRoutes: RouteObject = {
  path: ROUTES.INCOME,
  element: <IncomeScreen />,
};
