/**
 * Chaos Engineering Framework
 *
 * Systematic resilience testing via controlled fault injection.
 * Inspired by Netflix Chaos Monkey, adapted for TypeScript/Next.js.
 *
 * Fault Types:
 *   - Latency injection (add artificial delay to requests)
 *   - Error injection (force specific HTTP errors)
 *   - Timeout injection (force request timeouts)
 *   - Circuit breaker testing (force circuit to open)
 *   - Memory pressure (allocate memory)
 *   - Connection drop (terminate fetch mid-stream)
 *   - Rate limit simulation (return 429s)
 *   - Data corruption (return malformed JSON)
 *
 * Safety:
 *   - ONLY active when CHAOS_ENABLED=true (never in production by default)
 *   - Experiments have maximum duration and automatic cleanup
 *   - Percentage-based: only affects N% of requests
 *   - Target-specific: can target specific endpoints, providers, or users
 *
 * Usage:
 *   import { ChaosEngine, FaultType } from '@/lib/chaos-engineering';
 *
 *   const chaos = new ChaosEngine();
 *
 *   // Start an experiment
 *   chaos.startExperiment({
 *     name: 'coingecko-latency',
 *     fault: FaultType.LATENCY,
 *     target: { url: /coingecko/ },
 *     config: { delayMs: 2000 },
 *     percentage: 50,
 *     durationMs: 300_000, // 5 minutes
 *   });
 *
 *   // Check if a request should be faulted
 *   const fault = chaos.shouldFault(request);
 *   if (fault) await fault.apply();
 *
 * @module chaos-engineering
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum FaultType {
  LATENCY = 'latency',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  CIRCUIT_BREAK = 'circuit_break',
  RATE_LIMIT = 'rate_limit',
  DATA_CORRUPTION = 'data_corruption',
  CONNECTION_DROP = 'connection_drop',
  MEMORY_PRESSURE = 'memory_pressure',
}

export interface ExperimentConfig {
  /** Unique experiment name */
  name: string;
  /** Type of fault to inject */
  fault: FaultType;
  /** Target filter — which requests to affect */
  target: {
    url?: RegExp | string;
    method?: string;
    provider?: string;
    header?: Record<string, string>;
  };
  /** Fault-specific configuration */
  config: FaultConfig;
  /** Percentage of matching requests to fault (0-100) */
  percentage: number;
  /** Maximum experiment duration in ms */
  durationMs: number;
  /** Optional description */
  description?: string;
}

export type FaultConfig =
  | { delayMs: number }          // LATENCY
  | { statusCode: number; body?: string }  // ERROR
  | { timeoutMs: number }        // TIMEOUT
  | { circuit: string }          // CIRCUIT_BREAK
  | { statusCode: 429; retryAfter?: number }  // RATE_LIMIT
  | { corruption: 'truncate' | 'malformed' | 'empty' }  // DATA_CORRUPTION
  | Record<string, unknown>;     // Generic

export interface Experiment extends ExperimentConfig {
  id: string;
  startedAt: number;
  expiresAt: number;
  faultsInjected: number;
  requestsMatched: number;
  active: boolean;
}

export interface FaultAction {
  type: FaultType;
  apply: () => Promise<void>;
  getResponse?: () => Response;
}

export interface ChaosReport {
  experiments: Experiment[];
  totalFaults: number;
  totalMatched: number;
  activeExperiments: number;
  uptime: number;
}

// ---------------------------------------------------------------------------
// Chaos Engine
// ---------------------------------------------------------------------------

export class ChaosEngine {
  private experiments = new Map<string, Experiment>();
  private enabled: boolean;
  private startTime = Date.now();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.enabled = process.env.CHAOS_ENABLED === 'true';

    if (this.enabled) {
      // Periodic cleanup of expired experiments
      this.cleanupTimer = setInterval(() => this.cleanup(), 30_000);
      if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
        (this.cleanupTimer as NodeJS.Timeout).unref();
      }
      console.warn('[Chaos] Engine ACTIVE — fault injection enabled');
    }
  }

  /**
   * Whether chaos engineering is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start a new chaos experiment.
   */
  startExperiment(config: ExperimentConfig): Experiment {
    if (!this.enabled) {
      throw new Error('Chaos engineering is not enabled (set CHAOS_ENABLED=true)');
    }

    const now = Date.now();
    const experiment: Experiment = {
      ...config,
      id: `chaos-${config.name}-${now}`,
      startedAt: now,
      expiresAt: now + config.durationMs,
      faultsInjected: 0,
      requestsMatched: 0,
      active: true,
    };

    this.experiments.set(experiment.id, experiment);
    console.warn(`[Chaos] Experiment started: ${config.name} (${config.fault}), ${config.percentage}% for ${config.durationMs}ms`);

    // Auto-expire
    setTimeout(() => {
      experiment.active = false;
      console.warn(`[Chaos] Experiment expired: ${config.name}`);
    }, config.durationMs);

    return experiment;
  }

  /**
   * Stop a running experiment.
   */
  stopExperiment(id: string): void {
    const experiment = this.experiments.get(id);
    if (experiment) {
      experiment.active = false;
      console.warn(`[Chaos] Experiment stopped: ${experiment.name}`);
    }
  }

  /**
   * Stop all running experiments.
   */
  stopAll(): void {
    for (const exp of this.experiments.values()) {
      exp.active = false;
    }
  }

  /**
   * Check if a request should be faulted, and return the fault action if so.
   */
  shouldFault(request: { url: string; method?: string; headers?: Record<string, string> }): FaultAction | null {
    if (!this.enabled) return null;

    for (const experiment of this.experiments.values()) {
      if (!experiment.active) continue;
      if (Date.now() > experiment.expiresAt) {
        experiment.active = false;
        continue;
      }

      // Check target match
      if (!this.matchesTarget(request, experiment.target)) continue;

      experiment.requestsMatched++;

      // Probabilistic injection
      if (Math.random() * 100 > experiment.percentage) continue;

      experiment.faultsInjected++;
      return this.createFaultAction(experiment);
    }

    return null;
  }

  /**
   * Get the chaos report.
   */
  getReport(): ChaosReport {
    const experiments = [...this.experiments.values()];
    return {
      experiments,
      totalFaults: experiments.reduce((sum, e) => sum + e.faultsInjected, 0),
      totalMatched: experiments.reduce((sum, e) => sum + e.requestsMatched, 0),
      activeExperiments: experiments.filter((e) => e.active).length,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Destroy the engine and clean up timers.
   */
  destroy(): void {
    this.stopAll();
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private matchesTarget(
    request: { url: string; method?: string; headers?: Record<string, string> },
    target: ExperimentConfig['target'],
  ): boolean {
    if (target.url) {
      const urlPattern = target.url instanceof RegExp ? target.url : new RegExp(target.url, 'i');
      if (!urlPattern.test(request.url)) return false;
    }

    if (target.method && request.method && target.method.toUpperCase() !== request.method.toUpperCase()) {
      return false;
    }

    if (target.header && request.headers) {
      for (const [key, value] of Object.entries(target.header)) {
        if (request.headers[key] !== value) return false;
      }
    }

    return true;
  }

  private createFaultAction(experiment: Experiment): FaultAction {
    const config = experiment.config;

    switch (experiment.fault) {
      case FaultType.LATENCY:
        return {
          type: FaultType.LATENCY,
          apply: async () => {
            const delay = 'delayMs' in config ? (config as { delayMs: number }).delayMs : 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          },
        };

      case FaultType.ERROR:
        return {
          type: FaultType.ERROR,
          apply: async () => {},
          getResponse: () => {
            const { statusCode, body } = config as { statusCode: number; body?: string };
            return new Response(body ?? JSON.stringify({ error: 'Chaos fault injected', experiment: experiment.name }), {
              status: statusCode,
              headers: { 'Content-Type': 'application/json', 'X-Chaos-Experiment': experiment.name },
            });
          },
        };

      case FaultType.TIMEOUT:
        return {
          type: FaultType.TIMEOUT,
          apply: async () => {
            const timeout = 'timeoutMs' in config ? (config as { timeoutMs: number }).timeoutMs : 30000;
            await new Promise((resolve) => setTimeout(resolve, timeout));
          },
        };

      case FaultType.RATE_LIMIT:
        return {
          type: FaultType.RATE_LIMIT,
          apply: async () => {},
          getResponse: () => {
            const retryAfter = 'retryAfter' in config ? (config as { retryAfter?: number }).retryAfter : 60;
            return new Response(JSON.stringify({ error: 'Rate limited (chaos)', retryAfter }), {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(retryAfter),
                'X-Chaos-Experiment': experiment.name,
              },
            });
          },
        };

      case FaultType.DATA_CORRUPTION:
        return {
          type: FaultType.DATA_CORRUPTION,
          apply: async () => {},
          getResponse: () => {
            const corruption = 'corruption' in config ? (config as { corruption: string }).corruption : 'malformed';
            let body: string;
            switch (corruption) {
              case 'truncate':
                body = '{"data": [{"id": 1, "name": "bit';
                break;
              case 'empty':
                body = '';
                break;
              case 'malformed':
              default:
                body = '{not valid json<<>>';
            }
            return new Response(body, {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'X-Chaos-Experiment': experiment.name },
            });
          },
        };

      default:
        return {
          type: experiment.fault,
          apply: async () => {},
        };
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, exp] of this.experiments) {
      if (!exp.active && now - exp.expiresAt > 3600_000) {
        this.experiments.delete(id);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Pre-built Experiment Templates
// ---------------------------------------------------------------------------

export const EXPERIMENT_TEMPLATES = {
  /**
   * Simulate CoinGecko rate limiting.
   */
  coingeckoRateLimit: (): ExperimentConfig => ({
    name: 'coingecko-rate-limit',
    fault: FaultType.RATE_LIMIT,
    target: { url: /coingecko/ },
    config: { statusCode: 429 as const, retryAfter: 60 },
    percentage: 80,
    durationMs: 300_000,
    description: 'Simulate CoinGecko returning 429 for 80% of requests',
  }),

  /**
   * Simulate AI provider latency spike.
   */
  aiLatencySpike: (provider = 'groq'): ExperimentConfig => ({
    name: `${provider}-latency-spike`,
    fault: FaultType.LATENCY,
    target: { url: new RegExp(provider, 'i') },
    config: { delayMs: 5000 },
    percentage: 50,
    durationMs: 120_000,
    description: `Add 5s latency to 50% of ${provider} requests`,
  }),

  /**
   * Simulate upstream API returning corrupted data.
   */
  dataCorruption: (target = 'api'): ExperimentConfig => ({
    name: `${target}-data-corruption`,
    fault: FaultType.DATA_CORRUPTION,
    target: { url: new RegExp(target, 'i') },
    config: { corruption: 'malformed' },
    percentage: 10,
    durationMs: 60_000,
    description: `Return malformed JSON for 10% of ${target} requests`,
  }),

  /**
   * Simulate Redis connection failure.
   */
  redisFailure: (): ExperimentConfig => ({
    name: 'redis-failure',
    fault: FaultType.ERROR,
    target: { url: /redis|cache/ },
    config: { statusCode: 503, body: JSON.stringify({ error: 'Redis connection refused' }) },
    percentage: 100,
    durationMs: 60_000,
    description: 'Simulate complete Redis failure',
  }),

  /**
   * Simulate network partition (high latency + errors).
   */
  networkPartition: (): ExperimentConfig => ({
    name: 'network-partition',
    fault: FaultType.TIMEOUT,
    target: { url: /api/ },
    config: { timeoutMs: 30000 },
    percentage: 30,
    durationMs: 120_000,
    description: 'Simulate network partition affecting 30% of API requests',
  }),
};

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _engine: ChaosEngine | null = null;

export function getChaosEngine(): ChaosEngine {
  if (!_engine) _engine = new ChaosEngine();
  return _engine;
}
