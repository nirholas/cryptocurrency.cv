/**
 * Tests for providers/circuit-breaker.ts
 *
 * Covers the Netflix Hystrix-style circuit breaker:
 * - State transitions: CLOSED → OPEN → HALF_OPEN → CLOSED
 * - Sliding window failure rate calculation
 * - Adaptive backoff with exponential increase
 * - Half-open probe limiting
 * - Manual trip/reset
 * - Metrics reporting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker, CircuitOpenError } from '@/lib/providers/circuit-breaker';
import type { CircuitBreakerConfig } from '@/lib/providers/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAST_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 0.5,       // 50% failure rate trips
  windowSize: 4,               // Only 4 calls in sliding window
  halfOpenMaxProbes: 1,        // 1 probe at a time
  resetTimeoutMs: 100,         // Fast timeout for tests
  adaptiveBackoff: false,      // No backoff — predictable timing
};

const fail = () => Promise.reject(new Error('boom'));
const succeed = () => Promise.resolve('ok');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in CLOSED state', () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);
    expect(cb.state).toBe('CLOSED');
  });

  it('stays CLOSED when calls succeed', async () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);

    await cb.execute(succeed);
    await cb.execute(succeed);
    await cb.execute(succeed);

    expect(cb.state).toBe('CLOSED');
    expect(cb.metrics().totalSuccess).toBe(3);
  });

  it('transitions to OPEN when failure rate exceeds threshold', async () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);

    // 2 successes + 2 failures = 50% failure rate (at threshold)
    await cb.execute(succeed);
    await cb.execute(succeed);
    await expect(cb.execute(fail)).rejects.toThrow('boom');
    await expect(cb.execute(fail)).rejects.toThrow('boom');

    // At exactly threshold with windowSize=4, it should trip
    expect(cb.state).toBe('OPEN');
  });

  it('rejects calls immediately when OPEN', async () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);

    // Trip the circuit
    for (let i = 0; i < 4; i++) {
      await cb.execute(fail).catch(() => {});
    }
    expect(cb.state).toBe('OPEN');

    // Now calls should be rejected with CircuitOpenError
    await expect(cb.execute(succeed)).rejects.toThrow(CircuitOpenError);
  });

  it('CircuitOpenError has correct properties', async () => {
    const cb = new CircuitBreaker('my-provider', FAST_CONFIG);

    for (let i = 0; i < 4; i++) {
      await cb.execute(fail).catch(() => {});
    }

    try {
      await cb.execute(succeed);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(CircuitOpenError);
      expect((err as CircuitOpenError).providerName).toBe('my-provider');
    }
  });

  it('transitions to HALF_OPEN after reset timeout', async () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);

    // Trip the circuit
    for (let i = 0; i < 4; i++) {
      await cb.execute(fail).catch(() => {});
    }
    expect(cb.state).toBe('OPEN');

    // Advance past reset timeout
    vi.advanceTimersByTime(FAST_CONFIG.resetTimeoutMs + 1);

    expect(cb.state).toBe('HALF_OPEN');
  });

  it('returns to CLOSED after successful probe in HALF_OPEN', async () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);

    // Trip → OPEN
    for (let i = 0; i < 4; i++) {
      await cb.execute(fail).catch(() => {});
    }

    // Wait → HALF_OPEN
    vi.advanceTimersByTime(FAST_CONFIG.resetTimeoutMs + 1);
    expect(cb.state).toBe('HALF_OPEN');

    // Successful probe → CLOSED
    await cb.execute(succeed);
    expect(cb.state).toBe('CLOSED');
  });

  it('returns to OPEN after failed probe in HALF_OPEN', async () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);

    // Trip → OPEN
    for (let i = 0; i < 4; i++) {
      await cb.execute(fail).catch(() => {});
    }

    // Wait → HALF_OPEN
    vi.advanceTimersByTime(FAST_CONFIG.resetTimeoutMs + 1);

    // Failed probe → OPEN again
    await expect(cb.execute(fail)).rejects.toThrow('boom');
    expect(cb.state).toBe('OPEN');
  });

  it('limits concurrent probes in HALF_OPEN', async () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);

    // Trip → OPEN → wait → HALF_OPEN
    for (let i = 0; i < 4; i++) {
      await cb.execute(fail).catch(() => {});
    }
    vi.advanceTimersByTime(FAST_CONFIG.resetTimeoutMs + 1);

    // Start a slow probe that doesn't resolve yet
    const slowProbe = new Promise(resolve => setTimeout(resolve, 1000));
    const probePromise = cb.execute(() => slowProbe);

    // Second call during half-open should be rejected
    await expect(cb.execute(succeed)).rejects.toThrow(CircuitOpenError);

    // Resolve the first probe
    vi.advanceTimersByTime(1001);
    await probePromise;
  });

  it('manual trip() opens the circuit', () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);
    expect(cb.state).toBe('CLOSED');

    cb.trip();
    expect(cb.state).toBe('OPEN');
  });

  it('manual reset() closes the circuit', async () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);

    // Trip it
    for (let i = 0; i < 4; i++) {
      await cb.execute(fail).catch(() => {});
    }
    expect(cb.state).toBe('OPEN');

    cb.reset();
    expect(cb.state).toBe('CLOSED');

    // Should work again
    const result = await cb.execute(succeed);
    expect(result).toBe('ok');
  });

  it('metrics() returns accurate counts', async () => {
    const cb = new CircuitBreaker('test', FAST_CONFIG);

    await cb.execute(succeed);
    await cb.execute(succeed);
    await cb.execute(fail).catch(() => {});

    const m = cb.metrics();
    expect(m.totalSuccess).toBe(2);
    expect(m.totalFailure).toBe(1);
    expect(m.state).toBe('CLOSED');
    expect(m.failureRate).toBeCloseTo(1 / 3, 2);
  });

  describe('adaptive backoff', () => {
    const BACKOFF_CONFIG: CircuitBreakerConfig = {
      ...FAST_CONFIG,
      adaptiveBackoff: true,
      resetTimeoutMs: 100,
    };

    it('increases backoff on repeated failures', async () => {
      const cb = new CircuitBreaker('test', BACKOFF_CONFIG);

      // First trip
      for (let i = 0; i < 4; i++) {
        await cb.execute(fail).catch(() => {});
      }
      expect(cb.state).toBe('OPEN');

      // Wait for first reset timeout (100ms)
      vi.advanceTimersByTime(101);
      expect(cb.state).toBe('HALF_OPEN');

      // Fail the probe → back to OPEN with doubled timeout (200ms)
      await cb.execute(fail).catch(() => {});
      expect(cb.state).toBe('OPEN');

      // 100ms is NOT enough anymore
      vi.advanceTimersByTime(101);
      expect(cb.state).toBe('OPEN');

      // 200ms total should work
      vi.advanceTimersByTime(100);
      expect(cb.state).toBe('HALF_OPEN');
    });
  });
});
