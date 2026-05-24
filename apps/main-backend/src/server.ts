import { createServer, type Server } from 'node:http';

import { logger } from '@lib/logger.js';
import { closeMongo, connectMongo } from '@lib/mongo/client.js';

import { buildApp } from './app.js';
import { env } from './env.js';
import { startReaper, stopReaper } from './jobs/reaper.job.js';

const start = async (): Promise<Server> => {
  // Connect Mongo before accepting traffic — fail fast if it's unreachable.
  await connectMongo();
  startReaper();

  const app = buildApp();
  const server = createServer(app);
  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'main-backend listening');
  });
  return server;
};

let server: Server | undefined;

start().then(
  (s) => {
    server = s;
  },
  (err: unknown) => {
    logger.error({ err }, 'failed to start');
    process.exit(1);
  },
);

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'shutting down gracefully');
  stopReaper();
  if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
  await closeMongo();
  process.exit(0);
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
