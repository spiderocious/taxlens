import { MongoClient, type Collection, type Db } from 'mongodb';

import { logger } from '@lib/logger.js';

import { env } from '../../env.js';

import type { LlmAuditDoc } from './llm-audit.repository.js';
import type { TaxProcessDoc } from './tax-process.repository.js';

// Lazy singleton. connectMongo() is called once at boot; the collection
// accessors throw if used before connect, mirroring the apiClient proxy guard
// on the frontend.
let _client: MongoClient | null = null;
let _db: Db | null = null;

export const connectMongo = async (): Promise<void> => {
  if (_client) return;
  const client = new MongoClient(env.MONGODB_URI, {
    // Fail fast rather than hanging the boot if Mongo is unreachable.
    serverSelectionTimeoutMS: 5_000,
  });
  await client.connect();
  _client = client;
  _db = client.db(env.MONGODB_DB_NAME);
  await ensureIndexes(_db);
  logger.info({ db: env.MONGODB_DB_NAME }, 'mongo connected');
};

export const closeMongo = async (): Promise<void> => {
  if (!_client) return;
  await _client.close();
  _client = null;
  _db = null;
};

const requireDb = (): Db => {
  if (!_db) throw new Error('Mongo used before connectMongo() — call it at boot.');
  return _db;
};

export const COLLECTIONS = {
  TAX_PROCESSES: 'tax_processes',
  LLM_AUDIT: 'llm_audit',
} as const;

export const taxProcesses = (): Collection<TaxProcessDoc> =>
  requireDb().collection<TaxProcessDoc>(COLLECTIONS.TAX_PROCESSES);

export const llmAudit = (): Collection<LlmAuditDoc> =>
  requireDb().collection<LlmAuditDoc>(COLLECTIONS.LLM_AUDIT);

// Indexes are created once at connect. We use an explicit reaper job (not a TTL
// index) so we can purge audit alongside and emit metrics — the index here is
// just to make the reaper's idle scan and the unique-code lookup fast.
const ensureIndexes = async (db: Db): Promise<void> => {
  const processes = db.collection<TaxProcessDoc>(COLLECTIONS.TAX_PROCESSES);
  await processes.createIndex({ code: 1 }, { unique: true });
  await processes.createIndex({ lastInteractionAt: 1 });
  await processes.createIndex({ status: 1 });

  const audit = db.collection<LlmAuditDoc>(COLLECTIONS.LLM_AUDIT);
  await audit.createIndex({ code: 1, createdAt: -1 });
};
