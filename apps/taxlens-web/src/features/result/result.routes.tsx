import type { RouteObject } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { ResultScreen } from './screen/result-screen.tsx';


// /result/:code where :code ∈ { mock | manual | <8-digit statement code> }.
// The param is the source of truth so a refresh restores the result. A bare
// /result (no code) renders the empty "start here" state.
export const resultRoutes: RouteObject[] = [
  { path: ROUTES.RESULT_PATTERN, element: <ResultScreen /> },
  { path: ROUTES.RESULT, element: <ResultScreen /> },
];
