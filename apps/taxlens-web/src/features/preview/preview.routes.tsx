import type { RouteObject } from 'react-router-dom';
import { ROUTES } from '@taxlens/core';
import { PreviewScreen } from './screen/preview-screen.tsx';


export const previewRoutes: RouteObject = {
  path: ROUTES.PREVIEW,
  element: <PreviewScreen />,
};
