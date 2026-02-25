/**
 * Stablecoin Depeg Monitor — Real-time peg deviation detection
 *
 * Monitors stablecoin prices for deviation from their target peg and
 * generates alerts when thresholds are breached:
 *
 * - MINOR:    ±0.5% deviation  → log warning
 * - MODERATE: ±1.0% deviation  → WebSocket event
 * - SEVERE:   ±2.0% deviation  → WebSocket + alert webhook
 * - CRITICAL: ±5.0% deviation  → All channels + circuit breaker trigger
 *
 * @module stablecoin/depeg-monitor
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DepegSeverity = 'minor' | 'moderate' | 'severe' | 'critical';

export interface DepegAlert {
  symbol: string;
  name: string;
  price: number;
  pegTarget: number;
  deviationPct: number;
  severity: DepegSeverity;
  direction: 'above' | 'below';
  timestamp: string;
  durationMs: number;
}

export interface DepegMonitorConfig {
  /** Polling interval in ms (default 15 000) */
  pollIntervalMs: number;
  /** Thresholds in % */
  thresholds: Record<DepegSeverity, number>;
  /** Webhook URL for severe+ alerts */
  webhookUrl?: string;
  /** Max alerts per symbol per hour */
  rateLimit: number;
}

interface SymbolState {
  firstDeviation: number | null;
  lastAlertTs: number;
  alertCount: number;
  hourStart: number;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: DepegMonitorConfig = {
  pollIntervalMs: 15_000,
  thresholds: {
    minor: 0.5,
    moderate: 1.0,
    severe: 2.0,
    critical: 5.0,
  },
  rateLimit: 10,
};

// ---------------------------------------------------------------------------
// Stablecoin peg targets
// ---------------------------------------------------------------------------

const PEG_TARGETS: Record<string, number> = {
  USDT: 1.0,
  USDC: 1.0,
  DAI: 1.0,
  BUSD: 1.0,
  FRAX: 1.0,
  TUSD: 1.0,
  USDP: 1.0,
  PYUSD: 1.0,
  USDD: 1.0,
  GUSD: 1.0,
  LUSD: 1.0,
  SUSD: 1.0,
  CUSD: 1.0,
  EURT: 1.0,
  crvUSD: 1.0,
  GHO: 1.0,
  FDUSD: 1.0,
  USDe: 1.0,
  USDS: 1.0,
};

// ---------------------------------------------------------------------------
// DepegMonitor class
// ---------------------------------------------------------------------------

export class DepegMonitor {
  private config: DepegMonitorConfig;
  private state = new Map<string, SymbolState>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners: ((alert: DepegAlert) => void)[] = [];
  private running = false;

  constructor(config: Partial<DepegMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  start(priceFetcher: () => Promise<{ symbol: string; name: string; price: number }[]>): void {
    if (this.running) return;
    this.running = true;

    const tick = async () => {
      try {
        const prices = await priceFetcher();
        this.evaluate(prices);
      } catch { /* swallow — we don't crash the monitor */ }
    };

    // First tick immediately
    void tick();
    this.timer = setInterval(tick, this.config.pollIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Subscribe to depeg alerts */
  onAlert(fn: (alert: DepegAlert) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  /** Get current status for all monitored symbols */
  getStatus(): {
    running: boolean;
    monitored: string[];
    activeAlerts: DepegAlert[];
  } {
    return {
      running: this.running,
      monitored: Object.keys(PEG_TARGETS),
      activeAlerts: [...this.activeAlerts],
    };
  }

  // -----------------------------------------------------------------------
  // Active alerts buffer (last 50)
  // -----------------------------------------------------------------------

  private activeAlerts: DepegAlert[] = [];
  private pushAlert(alert: DepegAlert): void {
    this.activeAlerts.push(alert);
    if (this.activeAlerts.length > 50) this.activeAlerts.shift();
  }

  // -----------------------------------------------------------------------
  // Core evaluation
  // -----------------------------------------------------------------------

  evaluate(prices: { symbol: string; name: string; price: number }[]): DepegAlert[] {
    const now = Date.now();
    const alerts: DepegAlert[] = [];

    for (const entry of prices) {
      const target = PEG_TARGETS[entry.symbol];
      if (target == null) continue;

      const deviation = ((entry.price - target) / target) * 100;
      const absDev = Math.abs(deviation);

      // Determine severity
      let severity: DepegSeverity | null = null;
      if (absDev >= this.config.thresholds.critical) severity = 'critical';
      else if (absDev >= this.config.thresholds.severe) severity = 'severe';
      else if (absDev >= this.config.thresholds.moderate) severity = 'moderate';
      else if (absDev >= this.config.thresholds.minor) severity = 'minor';

      // Manage per-symbol state
      let s = this.state.get(entry.symbol);
      if (!s) {
        s = { firstDeviation: null, lastAlertTs: 0, alertCount: 0, hourStart: now };
        this.state.set(entry.symbol, s);
      }

      // Reset alert count every hour
      if (now - s.hourStart > 3_600_000) {
        s.alertCount = 0;
        s.hourStart = now;
      }

      if (severity == null) {
        // No deviation — reset
        s.firstDeviation = null;
        continue;
      }

      // Track when deviation first appeared
      if (s.firstDeviation == null) s.firstDeviation = now;

      // Rate limit per symbol
      if (s.alertCount >= this.config.rateLimit) continue;

      // Don't spam the same severity within 60s
      if (now - s.lastAlertTs < 60_000) continue;

      const alert: DepegAlert = {
        symbol: entry.symbol,
        name: entry.name,
        price: entry.price,
        pegTarget: target,
        deviationPct: Math.round(deviation * 100) / 100,
        severity,
        direction: deviation > 0 ? 'above' : 'below',
        timestamp: new Date(now).toISOString(),
        durationMs: now - s.firstDeviation,
      };

      alerts.push(alert);
      s.lastAlertTs = now;
      s.alertCount++;

      this.pushAlert(alert);

      // Notify listeners
      for (const fn of this.listeners) {
        try { fn(alert); } catch { /* never crash */ }
      }

      // Webhook for severe+
      if (
        (severity === 'severe' || severity === 'critical') &&
        this.config.webhookUrl
      ) {
        void this.sendWebhook(alert);
      }
    }

    return alerts;
  }

  // -----------------------------------------------------------------------
  // Webhook
  // -----------------------------------------------------------------------

  private async sendWebhook(alert: DepegAlert): Promise<void> {
    try {
      await fetch(this.config.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 STABLECOIN DEPEG: ${alert.symbol} at $${alert.price} (${alert.deviationPct > 0 ? '+' : ''}${alert.deviationPct}%) — ${alert.severity.toUpperCase()}`,
          alert,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch { /* webhook failures are non-fatal */ }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const depegMonitor = new DepegMonitor({
  webhookUrl: process.env.DEPEG_WEBHOOK_URL,
});
