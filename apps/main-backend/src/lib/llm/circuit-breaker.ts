import { logger } from '@lib/logger.js';

import type { CircuitState } from '../mongo/llm-audit.repository.js';

export class CircuitOpenError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super('Circuit is open');
    this.name = 'CircuitOpenError';
  }
}

// Classic 3-state breaker around a single dependency (the OpenAI client).
// closed → counts consecutive failures; opens at the threshold.
// open    → fast-fails (CircuitOpenError) until the cooldown elapses.
// half_open → lets one probe through; success closes, failure re-opens.
//
// Per-process singleton (in-memory) — adequate for one backend instance. For
// horizontal scale the state would move to Mongo/Redis (v2, see design doc).
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private openedAt = 0;
  private halfOpenInFlight = false;

  constructor(
    private readonly failureThreshold: number,
    private readonly cooldownMs: number,
    private readonly name = 'openai',
  ) {}

  getState(): CircuitState {
    // Lazily transition open → half_open once the cooldown has passed.
    if (this.state === 'open' && Date.now() - this.openedAt >= this.cooldownMs) {
      this.state = 'half_open';
      this.halfOpenInFlight = false;
      logger.warn({ breaker: this.name }, 'circuit half-open');
    }
    return this.state;
  }

  private remainingCooldownMs(): number {
    return Math.max(0, this.cooldownMs - (Date.now() - this.openedAt));
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.state !== 'closed') {
      this.state = 'closed';
      this.halfOpenInFlight = false;
      logger.info({ breaker: this.name }, 'circuit closed');
    }
  }

  private onFailure(): void {
    this.consecutiveFailures += 1;
    if (this.state === 'half_open' || this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
      this.halfOpenInFlight = false;
      logger.error(
        { breaker: this.name, consecutiveFailures: this.consecutiveFailures },
        'circuit opened',
      );
    }
  }

  // Runs `fn` under the breaker. Throws CircuitOpenError without calling `fn`
  // when open. The state captured BEFORE the call is returned to the caller so
  // it can be written to the audit row.
  async run<T>(fn: () => Promise<T>): Promise<{ result: T; stateAtCall: CircuitState }> {
    const state = this.getState();

    if (state === 'open') {
      throw new CircuitOpenError(this.remainingCooldownMs());
    }
    if (state === 'half_open') {
      if (this.halfOpenInFlight) throw new CircuitOpenError(this.remainingCooldownMs());
      this.halfOpenInFlight = true;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return { result, stateAtCall: state };
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }
}
