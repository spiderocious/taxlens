import { logger } from '@lib/logger.js';
import { llmAuditRepository } from '@lib/mongo/llm-audit.repository.js';
import { taxProcessRepository } from '@lib/mongo/tax-process.repository.js';

import { env } from '../env.js';

// Nuke processes (and their audit) idle past the TTL. "Idle" = no interaction
// (upload, poll, SSE subscribe, AI follow-up) within PROCESS_TTL_MS — each of
// those bumps lastInteractionAt. Explicit job (not a Mongo TTL index) so we can
// purge llm_audit alongside and emit a metric per sweep.
let timer: NodeJS.Timeout | null = null;

const sweep = async (): Promise<void> => {
  const cutoff = new Date(Date.now() - env.PROCESS_TTL_MS);
  try {
    const codes = await taxProcessRepository.deleteIdle(cutoff);
    const auditPurged = await llmAuditRepository.deleteByCodes(codes);
    if (codes.length > 0) {
      logger.info(
        { purgedProcesses: codes.length, purgedAudit: auditPurged, cutoff: cutoff.toISOString() },
        'reaper sweep',
      );
    } else {
      logger.debug({ cutoff: cutoff.toISOString() }, 'reaper sweep — nothing to purge');
    }
  } catch (err) {
    logger.error({ err }, 'reaper sweep failed');
  }
};

export const startReaper = (): void => {
  if (timer) return;
  // unref so the interval never holds the process open during shutdown.
  timer = setInterval(() => void sweep(), env.REAPER_INTERVAL_MS);
  timer.unref();
  logger.info({ intervalMs: env.REAPER_INTERVAL_MS, ttlMs: env.PROCESS_TTL_MS }, 'reaper started');
};

export const stopReaper = (): void => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
