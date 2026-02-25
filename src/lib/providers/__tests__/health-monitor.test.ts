/**
 * Tests for providers/health-monitor.ts
 *
 * Covers:
 * - Success/failure recording and rate calculation
 * - Latency tracking (p50, p95, p99)
 * - Chain health status (healthy/degraded/critical)
 * - Provider ranking by composite score
 * - Summary report formatting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HealthMonitor } from '@/lib/providers/health-monitor';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HealthMonitor', () => {
  let monitor: HealthMonitor;

  beforeEach(() => {
    monitor = new HealthMonitor();
  });

  describe('success/failure recording', () => {
    it('tracks successful requests', () => {
      monitor.recordSuccess('coingecko', 150);
      monitor.recordSuccess('coingecko', 200);
      monitor.recordSuccess('coingecko', 180);

      const health = monitor.getProviderHealth('coingecko');
      expect(health).toBeDefined();
      expect(health!.successRate).toBe(1.0);
      expect(health!.totalRequests).toBe(3);
    });

    it('tracks failures and computes rate', () => {
      monitor.recordSuccess('api', 100);
      monitor.recordSuccess('api', 100);
      monitor.recordFailure('api', 'timeout');
      monitor.recordFailure('api', 'error');

      const health = monitor.getProviderHealth('api');
      expect(health!.successRate).toBe(0.5);
      expect(health!.totalRequests).toBe(4);
    });

    it('returns undefined for unknown providers', () => {
      const health = monitor.getProviderHealth('nonexistent');
      expect(health).toBeUndefined();
    });
  });

  describe('latency tracking', () => {
    it('computes percentiles correctly', () => {
      // Add varying latencies
      const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      for (const lat of latencies) {
        monitor.recordSuccess('api', lat);
      }

      const health = monitor.getProviderHealth('api');
      expect(health).toBeDefined();

      // p50 should be around 50ms
      expect(health!.latencyP50).toBeGreaterThanOrEqual(40);
      expect(health!.latencyP50).toBeLessThanOrEqual(60);

      // p99 should be near 100ms
      expect(health!.latencyP99).toBeGreaterThanOrEqual(90);
    });
  });

  describe('chain health', () => {
    it('reports healthy when all providers succeed', () => {
      monitor.recordSuccess('a', 100);
      monitor.recordSuccess('b', 100);
      monitor.recordSuccess('c', 100);

      const health = monitor.getChainHealth(['a', 'b', 'c']);
      expect(health.status).toBe('healthy');
    });

    it('reports degraded when some providers fail', () => {
      monitor.recordSuccess('a', 100);
      for (let i = 0; i < 10; i++) {
        monitor.recordFailure('b', 'error');
      }
      monitor.recordSuccess('c', 100);

      const health = monitor.getChainHealth(['a', 'b', 'c']);
      expect(health.status).toBe('degraded');
    });

    it('reports critical when all providers fail', () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordFailure('a', 'error');
        monitor.recordFailure('b', 'error');
        monitor.recordFailure('c', 'error');
      }

      const health = monitor.getChainHealth(['a', 'b', 'c']);
      expect(health.status).toBe('critical');
    });
  });

  describe('provider ranking', () => {
    it('ranks faster, more reliable providers higher', () => {
      // Provider a: fast & reliable
      for (let i = 0; i < 10; i++) {
        monitor.recordSuccess('a', 50);
      }

      // Provider b: slow & reliable
      for (let i = 0; i < 10; i++) {
        monitor.recordSuccess('b', 500);
      }

      // Provider c: fast but unreliable
      for (let i = 0; i < 5; i++) {
        monitor.recordSuccess('c', 50);
        monitor.recordFailure('c', 'error');
      }

      const ranked = monitor.rankProviders(['a', 'b', 'c']);
      expect(ranked[0]).toBe('a'); // Fast & reliable wins
    });
  });

  describe('summary', () => {
    it('generates formatted summary string', () => {
      monitor.recordSuccess('coingecko', 150);
      monitor.recordSuccess('binance', 100);
      monitor.recordFailure('coincap', 'timeout');

      const summary = monitor.summary();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('coingecko');
      expect(summary).toContain('binance');
    });
  });
});
