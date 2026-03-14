import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitState,
  CircuitOpenError,
  CircuitTimeoutError,
  getCircuitBreakerHealth,
} from '@/lib/circuit-breaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    CircuitBreaker.resetAll();
    CircuitBreaker.registry.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('CircuitBreaker.for (singleton)', () => {
    it('should create a new breaker for a given name', () => {
      const breaker = CircuitBreaker.for('test-service');
      expect(breaker).toBeDefined();
      expect(breaker.name).toBe('test-service');
    });

    it('should return the same instance for the same name', () => {
      const a = CircuitBreaker.for('same');
      const b = CircuitBreaker.for('same');
      expect(a).toBe(b);
    });

    it('should create separate instances for different names', () => {
      const a = CircuitBreaker.for('svc-a');
      const b = CircuitBreaker.for('svc-b');
      expect(a).not.toBe(b);
    });
  });

  describe('Initial state', () => {
    it('should start in CLOSED state', () => {
      const breaker = CircuitBreaker.for('init');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should start with zero failures', () => {
      const breaker = CircuitBreaker.for('init2');
      expect(breaker.getFailures()).toBe(0);
    });
  });

  describe('CLOSED state', () => {
    it('should execute function and return result', async () => {
      const breaker = CircuitBreaker.for('closed-ok');
      const result = await breaker.call(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('should increment failure count on error', async () => {
      const breaker = CircuitBreaker.for('closed-fail', { failureThreshold: 10 });
      await expect(breaker.call(() => Promise.reject(new Error('fail')))).rejects.toThrow('fail');
      expect(breaker.getFailures()).toBe(1);
    });

    it('should reset failure count on success', async () => {
      const breaker = CircuitBreaker.for('closed-reset', { failureThreshold: 10 });
      await expect(breaker.call(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      expect(breaker.getFailures()).toBe(1);
      await breaker.call(() => Promise.resolve('ok'));
      expect(breaker.getFailures()).toBe(0);
    });
  });

  describe('CLOSED → OPEN transition', () => {
    it('should trip OPEN after reaching failure threshold', async () => {
      const breaker = CircuitBreaker.for('trip', { failureThreshold: 3 });
      for (let i = 0; i < 3; i++) {
        await expect(breaker.call(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should throw CircuitOpenError when OPEN', async () => {
      const breaker = CircuitBreaker.for('open-reject', {
        failureThreshold: 2,
        cooldownMs: 60_000,
      });
      // Trip the breaker
      for (let i = 0; i < 2; i++) {
        await expect(breaker.call(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      await expect(breaker.call(() => Promise.resolve('nope'))).rejects.toThrow(CircuitOpenError);
    });

    it('should call onStateChange when transitioning', async () => {
      const onChange = vi.fn();
      const breaker = CircuitBreaker.for('on-change', {
        failureThreshold: 2,
        onStateChange: onChange,
      });
      for (let i = 0; i < 2; i++) {
        await expect(breaker.call(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      }
      expect(onChange).toHaveBeenCalledWith('on-change', CircuitState.CLOSED, CircuitState.OPEN);
    });
  });

  describe('OPEN → HALF_OPEN transition', () => {
    it('should transition to HALF_OPEN after cooldown', async () => {
      vi.useFakeTimers();
      const breaker = CircuitBreaker.for('half-open', { failureThreshold: 2, cooldownMs: 5_000 });
      for (let i = 0; i < 2; i++) {
        await expect(breaker.call(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      vi.advanceTimersByTime(5_000);
      // The next call should transition to HALF_OPEN and attempt the fn
      await breaker.call(() => Promise.resolve('probe'));
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('HALF_OPEN → CLOSED (recovery)', () => {
    it('should reset to CLOSED on successful probe', async () => {
      vi.useFakeTimers();
      const breaker = CircuitBreaker.for('recover', { failureThreshold: 1, cooldownMs: 1_000 });
      await expect(breaker.call(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      vi.advanceTimersByTime(1_000);
      await breaker.call(() => Promise.resolve('healed'));
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.getFailures()).toBe(0);
    });
  });

  describe('HALF_OPEN → OPEN (probe fails)', () => {
    it('should return to OPEN if probe fails', async () => {
      vi.useFakeTimers();
      const breaker = CircuitBreaker.for('probe-fail', { failureThreshold: 1, cooldownMs: 1_000 });
      await expect(breaker.call(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      vi.advanceTimersByTime(1_000);
      await expect(breaker.call(() => Promise.reject(new Error('still broken')))).rejects.toThrow();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Timeout', () => {
    it('should throw CircuitTimeoutError when function exceeds timeoutMs', async () => {
      vi.useFakeTimers();
      const breaker = CircuitBreaker.for('timeout', { timeoutMs: 100, failureThreshold: 10 });
      const slowFn = () => new Promise<string>((resolve) => setTimeout(() => resolve('late'), 200));
      const callPromise = breaker.call(slowFn);
      vi.advanceTimersByTime(200);
      await expect(callPromise).rejects.toThrow(CircuitTimeoutError);
    });

    it('should succeed when function completes before timeout', async () => {
      const breaker = CircuitBreaker.for('timeout-ok', { timeoutMs: 5000, failureThreshold: 10 });
      const result = await breaker.call(() => Promise.resolve('fast'));
      expect(result).toBe('fast');
    });
  });

  describe('Auto-reset failure count', () => {
    it('should reset failure count after resetTimeoutMs with no new failures', async () => {
      vi.useFakeTimers();
      const breaker = CircuitBreaker.for('auto-reset', {
        failureThreshold: 5,
        resetTimeoutMs: 2_000,
      });
      // Add some failures but not enough to trip
      await expect(breaker.call(() => Promise.reject(new Error('f')))).rejects.toThrow();
      await expect(breaker.call(() => Promise.reject(new Error('f')))).rejects.toThrow();
      expect(breaker.getFailures()).toBe(2);

      vi.advanceTimersByTime(3_000);
      // Next call should see that enough time passed and reset the counter
      await breaker.call(() => Promise.resolve('ok'));
      expect(breaker.getFailures()).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset state and failures', async () => {
      const breaker = CircuitBreaker.for('manual-reset', { failureThreshold: 1 });
      await expect(breaker.call(() => Promise.reject(new Error('f')))).rejects.toThrow();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      breaker.reset();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.getFailures()).toBe(0);
    });
  });

  describe('resetAll', () => {
    it('should reset all breakers in registry', async () => {
      const a = CircuitBreaker.for('ra', { failureThreshold: 1 });
      const b = CircuitBreaker.for('rb', { failureThreshold: 1 });
      await expect(a.call(() => Promise.reject(new Error('f')))).rejects.toThrow();
      await expect(b.call(() => Promise.reject(new Error('f')))).rejects.toThrow();
      expect(a.getState()).toBe(CircuitState.OPEN);
      expect(b.getState()).toBe(CircuitState.OPEN);
      CircuitBreaker.resetAll();
      expect(a.getState()).toBe(CircuitState.CLOSED);
      expect(b.getState()).toBe(CircuitState.CLOSED);
    });
  });
});

describe('CircuitOpenError', () => {
  it('should have correct name and serviceName', () => {
    const err = new CircuitOpenError('my-svc');
    expect(err.name).toBe('CircuitOpenError');
    expect(err.serviceName).toBe('my-svc');
    expect(err.message).toContain('my-svc');
  });
});

describe('CircuitTimeoutError', () => {
  it('should have correct name and serviceName', () => {
    const err = new CircuitTimeoutError('svc', 5000);
    expect(err.name).toBe('CircuitTimeoutError');
    expect(err.serviceName).toBe('svc');
    expect(err.message).toContain('5000');
  });
});

describe('getCircuitBreakerHealth', () => {
  beforeEach(() => {
    CircuitBreaker.resetAll();
    CircuitBreaker.registry.clear();
  });

  it('should return health for all registered breakers', () => {
    CircuitBreaker.for('health-a');
    CircuitBreaker.for('health-b');
    const health = getCircuitBreakerHealth();
    expect(health['health-a']).toEqual({ state: CircuitState.CLOSED, failures: 0 });
    expect(health['health-b']).toEqual({ state: CircuitState.CLOSED, failures: 0 });
  });

  it('should reflect failures', async () => {
    const breaker = CircuitBreaker.for('health-fail', { failureThreshold: 10 });
    await expect(breaker.call(() => Promise.reject(new Error('f')))).rejects.toThrow();
    const health = getCircuitBreakerHealth();
    expect(health['health-fail'].failures).toBe(1);
  });
});
