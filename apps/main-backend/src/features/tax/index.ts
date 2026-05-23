import type { Express } from 'express';

import taxRoutes from './tax.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/tax', taxRoutes);
};
