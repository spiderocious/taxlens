import { EventEmitter } from 'node:events';

import type { StatementProcessView } from '@taxlens/core';

// In-process pub/sub so the SSE endpoint can push status changes without
// polling Mongo. Keyed by process code. Single-instance only — horizontal
// scale would need Redis pub/sub (v2). The poll endpoint remains the durable
// fallback for anything an SSE subscriber misses (e.g. it connected late).
class StatementEvents extends EventEmitter {
  emitUpdate(code: string, view: StatementProcessView): void {
    this.emit(code, view);
  }

  onUpdate(code: string, listener: (view: StatementProcessView) => void): () => void {
    this.on(code, listener);
    return () => this.off(code, listener);
  }
}

// Generous cap — many concurrent SSE clients on the same code is unusual but
// shouldn't trip the default 10-listener warning.
export const statementEvents = new StatementEvents().setMaxListeners(100);
