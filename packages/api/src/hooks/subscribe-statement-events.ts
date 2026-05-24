import type { StatementProcessView } from '@taxlens/core';

import { _currentApiBaseUrl } from '../client.js';
import { EP } from '../endpoints.js';

const TERMINAL = new Set<StatementProcessView['status']>(['ready', 'failed']);

export interface SubscribeHandlers {
  onStatus: (view: StatementProcessView) => void;
  onError?: (err: Event) => void;
}

// Subscribe to live parse-status updates via SSE (EventSource). Returns an
// unsubscribe function. Auto-closes on a terminal status. The server also emits
// the current state immediately on connect, so a late subscriber is in sync.
// Falls back to nothing if the API base URL isn't configured yet — callers
// should pair this with useStatementStatus (poll) as the durable fallback.
export const subscribeStatementEvents = (
  code: string,
  { onStatus, onError }: SubscribeHandlers,
): (() => void) => {
  const base = _currentApiBaseUrl();
  if (!base) return () => {};

  const prefix = base.endsWith('/') ? base : `${base}/`;
  const url = `${prefix}${EP.STATEMENT_EVENTS(code)}`;
  const source = new EventSource(url);

  source.addEventListener('status', (evt) => {
    try {
      const view = JSON.parse((evt as MessageEvent).data) as StatementProcessView;
      onStatus(view);
      if (TERMINAL.has(view.status)) source.close();
    } catch {
      // ignore malformed frames; the poll fallback will reconcile
    }
  });

  source.onerror = (err) => {
    onError?.(err);
    // EventSource auto-reconnects; leave it unless terminal already closed it.
  };

  return () => source.close();
};
