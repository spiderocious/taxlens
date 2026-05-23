import type { Express } from 'express';

import aiRoutes from './ai.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/ai', aiRoutes);
};
