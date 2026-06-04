import { randomInt } from 'node:crypto';

import {
  periodConfidenceFor,
  type ChatMessage,
  type ProcessStatus,
  type ProfileType,
  type RegimeComparison,
  type StatementInflow,
  type StatementProcessView,
} from '@taxlens/core';
import type { OptionalId, UpdateFilter } from 'mongodb';

import { ConflictError } from '@lib/errors.js';

import { taxProcesses } from './client.js';

// The persisted document. Money is integer kobo. Server-only fields (OpenAI
// response ids, raw chat) never leave via toView().
export interface TaxProcessDoc {
  code: string;
  status: ProcessStatus;
  profileType: ProfileType;
  failureReason?: string;

  // tier-1 gate output
  bankName?: string;
  monthsCovered?: number;

  // tier-2 analysis output
  inflows?: StatementInflow[];
  grossAnnualKobo?: number;

  // tax engine output (engine is the authority, never the LLM)
  computation?: RegimeComparison;

  // OpenAI continuity
  gateResponseId?: string;
  analysisResponseId?: string;
  chatMessages?: ChatMessage[];

  createdAt: Date;
  updatedAt: Date;
  lastInteractionAt: Date;
}

// App-owned state machine. Client-sent status is never trusted; every advance
// goes through assertTransition.
const VALID_TRANSITIONS: Record<ProcessStatus, ProcessStatus[]> = {
  pending: ['validating', 'failed'],
  validating: ['analyzing', 'failed'],
  // analysis can land on a usable result, a needs-review result (income zeroed
  // out while inflows exist), or fail outright.
  analyzing: ['ready', 'needs_review', 'failed'],
  // needs_review → ready when the user reclassifies inflows and we recompute.
  needs_review: ['ready'],
  ready: [],
  failed: [],
};

export const canTransition = (from: ProcessStatus, to: ProcessStatus): boolean =>
  // VALID_TRANSITIONS has an entry for every ProcessStatus, but
  // noUncheckedIndexedAccess types the lookup as possibly undefined.
  (VALID_TRANSITIONS[from] ?? []).includes(to);

// 8-digit numeric code, zero-padded. randomInt is uniform; collisions are
// handled by the unique index + retry in create().
const newCode = (): string => randomInt(0, 100_000_000).toString().padStart(8, '0');

const toView = (doc: TaxProcessDoc): StatementProcessView => {
  const inflowsSumKobo = doc.inflows?.reduce((s, f) => s + f.amountKobo, 0);
  return {
    code: doc.code,
    status: doc.status,
    profileType: doc.profileType,
    ...(doc.failureReason !== undefined ? { failureReason: doc.failureReason } : {}),
    ...(doc.bankName !== undefined ? { bankName: doc.bankName } : {}),
    ...(doc.monthsCovered !== undefined
      ? { monthsCovered: doc.monthsCovered, periodConfidence: periodConfidenceFor(doc.monthsCovered) }
      : {}),
    ...(doc.inflows !== undefined ? { inflows: doc.inflows, inflowsSumKobo: inflowsSumKobo ?? 0 } : {}),
    ...(doc.grossAnnualKobo !== undefined ? { grossAnnualKobo: doc.grossAnnualKobo } : {}),
    ...(doc.computation !== undefined ? { computation: doc.computation } : {}),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

export const taxProcessRepository = {
  toView,

  async create(profileType: ProfileType): Promise<TaxProcessDoc> {
    const now = new Date();
    // Retry on the (vanishingly unlikely) unique-code collision.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const doc: OptionalId<TaxProcessDoc> = {
        code: newCode(),
        status: 'pending',
        profileType,
        createdAt: now,
        updatedAt: now,
        lastInteractionAt: now,
      };
      try {
        await taxProcesses().insertOne(doc);
        return doc as TaxProcessDoc;
      } catch (err) {
        const isDup = err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000;
        if (!isDup) throw err;
      }
    }
    throw new ConflictError('Could not allocate a unique code; retry the upload');
  },

  async findByCode(code: string): Promise<TaxProcessDoc | null> {
    return taxProcesses().findOne({ code });
  },

  // Advances status with a guard, and applies a partial patch atomically.
  async advance(
    code: string,
    to: ProcessStatus,
    patch: Partial<Omit<TaxProcessDoc, 'code' | 'status' | 'createdAt'>> = {},
  ): Promise<TaxProcessDoc | null> {
    const current = await taxProcesses().findOne({ code });
    if (!current) return null;
    if (current.status === to) {
      // idempotent no-op transitions are fine (e.g. re-emitting terminal state)
      return current;
    }
    if (!canTransition(current.status, to)) {
      throw new ConflictError(
        `Invalid status transition: ${current.status} → ${to} for process ${code}`,
      );
    }
    const now = new Date();
    const result = await taxProcesses().findOneAndUpdate(
      { code },
      { $set: { ...patch, status: to, updatedAt: now } },
      { returnDocument: 'after' },
    );
    return result;
  },

  // Bumps the reaper clock. Called on every interaction (poll, SSE, ask).
  async touch(code: string): Promise<void> {
    await taxProcesses().updateOne({ code }, { $set: { lastInteractionAt: new Date() } });
  },

  async appendChat(
    code: string,
    messages: ChatMessage[],
    analysisResponseId?: string,
  ): Promise<void> {
    const now = new Date();
    // mongo's PushOperator typing is over-strict for fields declared as
    // optional arrays (chatMessages?: ChatMessage[]). Use UpdateFilter so the
    // $push narrowing is correctly applied.
    const update: UpdateFilter<TaxProcessDoc> = {
      $push: { chatMessages: { $each: messages } },
      $set: {
        updatedAt: now,
        lastInteractionAt: now,
        ...(analysisResponseId !== undefined ? { analysisResponseId } : {}),
      },
    };
    await taxProcesses().updateOne({ code }, update);
  },

  // User reclassified inflows → persist the corrected gross + recomputed result
  // and land on 'ready'. Unconditional (not a pipeline transition): valid from
  // both needs_review and an already-ready process the user re-marks. Bumps the
  // reaper clock — reclassifying is an interaction, and keeps the AI grounded on
  // the corrected numbers.
  async applyRecompute(
    code: string,
    grossAnnualKobo: number,
    computation: RegimeComparison,
  ): Promise<TaxProcessDoc | null> {
    const now = new Date();
    return taxProcesses().findOneAndUpdate(
      { code },
      {
        $set: {
          grossAnnualKobo,
          computation,
          status: 'ready',
          updatedAt: now,
          lastInteractionAt: now,
        },
      },
      { returnDocument: 'after' },
    );
  },

  // Reaper: delete processes idle past the cutoff. Returns the deleted codes so
  // the caller can purge their audit and count them.
  async deleteIdle(cutoff: Date): Promise<string[]> {
    const idle = await taxProcesses()
      .find({ lastInteractionAt: { $lt: cutoff } }, { projection: { code: 1 } })
      .toArray();
    const codes = idle.map((d) => d.code);
    if (codes.length > 0) {
      await taxProcesses().deleteMany({ code: { $in: codes } });
    }
    return codes;
  },
};
