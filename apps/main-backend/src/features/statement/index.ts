import type { Express } from 'express';

import statementRoutes from './statement.routes.js';

export const register = (app: Express): void => {
  app.use('/api/v1/statement', statementRoutes);
};
