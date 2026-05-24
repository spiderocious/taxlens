import { llmAudit } from './client.js';

export type LlmTier = 'gate' | 'analysis' | 'chat';
export type CircuitState = 'closed' | 'open' | 'half_open';

// One row per OpenAI call. Append-only by convention: this repo exposes insert
// and read only — no update, no delete (except the reaper's bulk purge). Stores
// a prompt HASH, never raw statement text (PII).
export interface LlmAuditDoc {
  code: string;
  tier: LlmTier;
  model: string;
  requestId: string | undefined;
  promptHash: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  verdict?: string;
  circuitState: CircuitState;
  error?: string;
  createdAt: Date;
}

export type LlmAuditInput = Omit<LlmAuditDoc, 'createdAt'>;

export const llmAuditRepository = {
  async record(entry: LlmAuditInput): Promise<void> {
    await llmAudit().insertOne({ ...entry, createdAt: new Date() });
  },

  async listByCode(code: string): Promise<LlmAuditDoc[]> {
    return llmAudit().find({ code }).sort({ createdAt: -1 }).toArray();
  },

  // Reaper companion: purge audit for processes that were deleted.
  async deleteByCodes(codes: string[]): Promise<number> {
    if (codes.length === 0) return 0;
    const res = await llmAudit().deleteMany({ code: { $in: codes } });
    return res.deletedCount;
  },
};
