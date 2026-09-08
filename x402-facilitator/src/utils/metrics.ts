/**
 * Minimal Prometheus-style metrics registry. Counters and histograms are kept
 * in memory and rendered as text/plain exposition format at GET /metrics.
 */

export class Counter {
  private value = 0;
  constructor(readonly name: string, readonly help: string) {}
  inc(by = 1): void {
    this.value += by;
  }
  get(): number {
    return this.value;
  }
  render(): string {
    return `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} counter\n${this.name} ${this.value}\n`;
  }
}

export class Histogram {
  private readonly counts: number[];
  private sum = 0;
  private total = 0;
  constructor(
    readonly name: string,
    readonly help: string,
    readonly buckets: number[] = [50, 100, 250, 500, 1000, 2500, 5000, 10000],
  ) {
    this.counts = buckets.map(() => 0);
  }
  observe(valueMs: number): void {
    this.sum += valueMs;
    this.total += 1;
    this.buckets.forEach((bound, i) => {
      if (valueMs <= bound) this.counts[i] += 1;
    });
  }
  render(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    let cumulative = 0;
    this.buckets.forEach((bound, i) => {
      cumulative = this.counts[i];
      lines.push(`${this.name}_bucket{le="${bound}"} ${cumulative}`);
    });
    lines.push(`${this.name}_bucket{le="+Inf"} ${this.total}`);
    lines.push(`${this.name}_sum ${this.sum}`);
    lines.push(`${this.name}_count ${this.total}`);
    return lines.join('\n') + '\n';
  }
}

export const metrics = {
  verifyRequests: new Counter('x402_verify_requests_total', 'Verification requests received'),
  verifyErrors: new Counter('x402_verify_errors_total', 'Verification requests that threw'),
  verifyLatency: new Histogram('x402_verify_latency_ms', 'Verification latency in milliseconds'),
  settleSuccess: new Counter('x402_settle_success_total', 'Settlements confirmed on-chain'),
  settleFailed: new Counter('x402_settle_failed_total', 'Settlements that failed on-chain or at RPC'),
  settleRejected: new Counter('x402_settle_rejected_total', 'Settlements rejected before submission'),
  settleLatency: new Histogram('x402_settle_latency_ms', 'Settlement latency in milliseconds'),
};

export function renderMetrics(): string {
  return Object.values(metrics)
    .map((m) => m.render())
    .join('');
}
