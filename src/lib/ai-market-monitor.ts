/**
 * Autonomous AI Market Monitor
 *
 * A persistent, multi-step AI agent that continuously:
 * 1. Observes — Polls news, prices, on-chain data, social signals
 * 2. Thinks — Detects anomalies, correlates events, classifies regime
 * 3. Acts — Generates alerts, reports, and recommendations proactively
 *
 * Unlike the commentary stream (which is prompt→response), this is an
 * autonomous LOOP with memory, state, and chained reasoning.
 *
 * Architecture:
 *   Monitor → ObservationQueue → ReasoningEngine → ActionDispatcher
 *
 * @module lib/ai-market-monitor
 */

import { aiComplete, getAIConfigOrNull } from './ai-provider';
import { getLatestNews } from './crypto-news';
import { buildMarketSnapshot, type MarketSnapshot } from './ai-commentary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertSeverity = 'info' | 'watch' | 'warning' | 'critical';
export type MonitorState = 'idle' | 'observing' | 'analyzing' | 'alerting' | 'sleeping';
export type MarketRegimeType = 'bull' | 'bear' | 'sideways' | 'high-vol' | 'low-vol' | 'euphoria' | 'capitulation';

export interface Observation {
  id: string;
  timestamp: string;
  source: 'news' | 'price' | 'onchain' | 'social' | 'derivatives';
  raw: string;
  significance: number; // 0-100
  processed: boolean;
}

export interface MarketRegime {
  current: MarketRegimeType;
  previous: MarketRegimeType;
  changedAt: string;
  confidence: number;
  indicators: string[];
}

export interface MonitorAlert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  title: string;
  summary: string;
  analysis: string;
  tickers: string[];
  triggers: string[];
  recommendation: string;
  confidence: number;
  expiresAt: string;
  category: 'price' | 'news' | 'correlation' | 'anomaly' | 'regime-change' | 'narrative-shift';
}

export interface IntelligenceReport {
  id: string;
  timestamp: string;
  type: 'hourly-brief' | 'anomaly-report' | 'regime-change' | 'correlation-alert' | 'risk-assessment';
  title: string;
  executive_summary: string;
  sections: ReportSection[];
  alerts: MonitorAlert[];
  regime: MarketRegime;
  metrics: MonitorMetrics;
}

export interface ReportSection {
  heading: string;
  content: string;
  data?: Record<string, unknown>;
}

export interface MonitorMetrics {
  observationsProcessed: number;
  alertsGenerated: number;
  averageLatency: number;
  uptime: number;
  lastObservation: string;
  lastAlert: string;
  cyclesCompleted: number;
}

export interface MonitorConfig {
  observationIntervalMs: number;
  analysisIntervalMs: number;
  maxObservationsQueue: number;
  alertThreshold: number; // min significance to generate alert
  regime: MarketRegime;
}

// ---------------------------------------------------------------------------
// Memory Store
// ---------------------------------------------------------------------------

class MonitorMemory {
  private observations: Observation[] = [];
  private alerts: MonitorAlert[] = [];
  private reports: IntelligenceReport[] = [];
  private snapshots: MarketSnapshot[] = [];
  private regime: MarketRegime;
  private metrics: MonitorMetrics;

  constructor() {
    this.regime = {
      current: 'sideways',
      previous: 'sideways',
      changedAt: new Date().toISOString(),
      confidence: 50,
      indicators: [],
    };
    this.metrics = {
      observationsProcessed: 0,
      alertsGenerated: 0,
      averageLatency: 0,
      uptime: 0,
      lastObservation: '',
      lastAlert: '',
      cyclesCompleted: 0,
    };
  }

  addObservation(obs: Observation) {
    this.observations.unshift(obs);
    this.observations = this.observations.slice(0, 500); // keep last 500
    this.metrics.observationsProcessed++;
    this.metrics.lastObservation = obs.timestamp;
  }

  addAlert(alert: MonitorAlert) {
    this.alerts.unshift(alert);
    this.alerts = this.alerts.slice(0, 100);
    this.metrics.alertsGenerated++;
    this.metrics.lastAlert = alert.timestamp;
  }

  addReport(report: IntelligenceReport) {
    this.reports.unshift(report);
    this.reports = this.reports.slice(0, 50);
  }

  addSnapshot(snap: MarketSnapshot) {
    this.snapshots.unshift(snap);
    this.snapshots = this.snapshots.slice(0, 60); // ~1hr of minute snapshots
  }

  getRecentObservations(n = 20): Observation[] { return this.observations.slice(0, n); }
  getRecentAlerts(n = 10): MonitorAlert[] { return this.alerts.slice(0, n); }
  getRecentReports(n = 5): IntelligenceReport[] { return this.reports.slice(0, n); }
  getRecentSnapshots(n = 10): MarketSnapshot[] { return this.snapshots.slice(0, n); }
  getRegime(): MarketRegime { return this.regime; }
  setRegime(regime: MarketRegime) { this.regime = regime; }
  getMetrics(): MonitorMetrics { return this.metrics; }
  incrementCycles() { this.metrics.cyclesCompleted++; }
  getUnprocessedObservations(): Observation[] { return this.observations.filter(o => !o.processed); }

  markProcessed(ids: string[]) {
    for (const obs of this.observations) {
      if (ids.includes(obs.id)) obs.processed = true;
    }
  }

  // Build context window for AI reasoning
  buildContextWindow(): string {
    const recentObs = this.getRecentObservations(15);
    const recentAlerts = this.getRecentAlerts(5);
    const snapshots = this.getRecentSnapshots(3);

    let context = `CURRENT REGIME: ${this.regime.current} (confidence: ${this.regime.confidence}%)\n`;
    context += `Regime changed at: ${this.regime.changedAt}\n`;
    context += `Indicators: ${this.regime.indicators.join(', ')}\n\n`;

    if (snapshots.length > 0) {
      const s = snapshots[0];
      context += `LATEST MARKET STATE:\n`;
      context += `  BTC: $${s.btcPrice.toLocaleString()} (${s.btcChange24h > 0 ? '+' : ''}${s.btcChange24h.toFixed(2)}%)\n`;
      context += `  ETH: $${s.ethPrice.toLocaleString()} (${s.ethChange24h > 0 ? '+' : ''}${s.ethChange24h.toFixed(2)}%)\n`;
      context += `  Fear & Greed: ${s.fearGreed}/100 (${s.fearGreedLabel})\n`;
      context += `  BTC Dominance: ${s.dominanceBtc.toFixed(1)}%\n\n`;
    }

    if (recentObs.length > 0) {
      context += `RECENT OBSERVATIONS (${recentObs.length}):\n`;
      recentObs.forEach(o => {
        context += `  [${o.source}] (sig: ${o.significance}) ${o.raw}\n`;
      });
      context += '\n';
    }

    if (recentAlerts.length > 0) {
      context += `RECENT ALERTS (${recentAlerts.length}):\n`;
      recentAlerts.forEach(a => {
        context += `  [${a.severity}] ${a.title}: ${a.summary}\n`;
      });
    }

    return context;
  }
}

// ---------------------------------------------------------------------------
// Observation Engine
// ---------------------------------------------------------------------------

async function collectObservations(): Promise<Observation[]> {
  const observations: Observation[] = [];
  const now = new Date().toISOString();

  // 1. News observations
  try {
    const news = await getLatestNews(10);
    for (const article of news.articles.slice(0, 5)) {
      observations.push({
        id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: now,
        source: 'news',
        raw: `[${article.source}] ${article.title} (${article.timeAgo})`,
        significance: estimateNewsSignificance(article.title),
        processed: false,
      });
    }
  } catch { /* silently fail — monitor should be resilient */ }

  // 2. Price observations
  try {
    const snapshot = await buildMarketSnapshot();
    const btcMag = Math.abs(snapshot.btcChange24h);
    
    observations.push({
      id: `price-${Date.now()}`,
      timestamp: now,
      source: 'price',
      raw: `BTC $${snapshot.btcPrice.toLocaleString()} (${snapshot.btcChange24h > 0 ? '+' : ''}${snapshot.btcChange24h.toFixed(2)}%), ETH $${snapshot.ethPrice.toLocaleString()} (${snapshot.ethChange24h > 0 ? '+' : ''}${snapshot.ethChange24h.toFixed(2)}%), F&G: ${snapshot.fearGreed} (${snapshot.fearGreedLabel})`,
      significance: Math.min(100, btcMag * 15 + (snapshot.fearGreed > 80 || snapshot.fearGreed < 20 ? 30 : 0)),
      processed: false,
    });

    // Top mover alerts
    for (const mover of snapshot.topMovers) {
      if (Math.abs(mover.change) > 10) {
        observations.push({
          id: `mover-${mover.symbol}-${Date.now()}`,
          timestamp: now,
          source: 'price',
          raw: `${mover.symbol} moved ${mover.change > 0 ? '+' : ''}${mover.change.toFixed(2)}% in 24h`,
          significance: Math.min(100, Math.abs(mover.change) * 5),
          processed: false,
        });
      }
    }
  } catch { /* silently fail */ }

  return observations;
}

function estimateNewsSignificance(title: string): number {
  const lower = title.toLowerCase();
  let score = 30; // baseline

  // High significance keywords
  if (/hack|exploit|vulnerability|stolen/i.test(lower)) score += 40;
  if (/sec |regulation|ban|lawsuit|indictment/i.test(lower)) score += 35;
  if (/etf.*approv|etf.*reject|etf.*file/i.test(lower)) score += 35;
  if (/crash|plunge|soar|surge|record.*high|all.time/i.test(lower)) score += 30;
  if (/fed |fomc|rate.*cut|rate.*hike|inflation/i.test(lower)) score += 25;
  if (/blackrock|jpmorgan|goldman|fidelity/i.test(lower)) score += 20;
  if (/partnership|acquisition|merger/i.test(lower)) score += 15;
  if (/bitcoin|ethereum/i.test(lower)) score += 10;

  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// Reasoning Engine
// ---------------------------------------------------------------------------

async function analyzeObservations(
  memory: MonitorMemory
): Promise<{ alerts: MonitorAlert[]; regime: MarketRegime }> {
  const config = getAIConfigOrNull();
  if (!config) {
    return { alerts: [], regime: memory.getRegime() };
  }

  const context = memory.buildContextWindow();
  const unprocessed = memory.getUnprocessedObservations();

  if (unprocessed.length === 0) {
    return { alerts: [], regime: memory.getRegime() };
  }

  const system = `You are an autonomous crypto market intelligence agent with a persistent memory.

Your job is to:
1. ANALYZE new observations against the current market context
2. DETECT anomalies, correlations, and regime changes
3. GENERATE alerts only when actionable intelligence is found
4. UPDATE the market regime classification

ALERT SEVERITY GUIDE:
- "info": Notable but not urgent (e.g., new partnership announcement)
- "watch": Worth monitoring (e.g., unusual funding rate)
- "warning": Requires attention (e.g., major regulatory news, large price move)
- "critical": Immediate attention (e.g., exchange hack, crash >10%, ETF decision)

REGIME TYPES:
- "bull": Sustained uptrend, positive sentiment
- "bear": Sustained downtrend, negative sentiment
- "sideways": Range-bound, low conviction
- "high-vol": High volatility, uncertain direction
- "low-vol": Unusually calm, potential breakout brewing
- "euphoria": Extreme greed, bubble signals
- "capitulation": Extreme fear, potential bottom

OUTPUT JSON:
{
  "alerts": [
    {
      "severity": "info"|"watch"|"warning"|"critical",
      "title": "Short alert title",
      "summary": "One-line summary",
      "analysis": "2-3 sentences of deep analysis connecting multiple data points",
      "tickers": ["BTC", "ETH"],
      "triggers": ["trigger1", "trigger2"],
      "recommendation": "What to watch for or do",
      "confidence": 0-100,
      "category": "price"|"news"|"correlation"|"anomaly"|"regime-change"|"narrative-shift"
    }
  ],
  "regime": {
    "current": "regime_type",
    "confidence": 0-100,
    "indicators": ["indicator1", "indicator2"]
  },
  "meta": {
    "reasoning": "Brief chain-of-thought explaining your analysis process"
  }
}

RULES:
- Only generate alerts for SIGNIFICANT findings. Most cycles should return 0-1 alerts.
- Connect dots between different observation sources (news + price = insight)
- Track narrative shifts — when the story changes, that's an alert
- Conservative default: when uncertain, lower severity and confidence
- NEVER generate more than 3 alerts per cycle
- Respond ONLY with valid JSON`;

  const user = `MONITOR CONTEXT:
${context}

NEW OBSERVATIONS TO ANALYZE (${unprocessed.length}):
${unprocessed.map(o => `  [${o.source}] (sig: ${o.significance}) ${o.raw}`).join('\n')}

Analyze these new observations against the full context. Generate alerts if warranted. Update regime if changed.`;

  try {
    const raw = await aiComplete(system, user, {
      maxTokens: 2000,
      temperature: 0.3,
      jsonMode: true,
    });

    const parsed = JSON.parse(raw);

    const alerts: MonitorAlert[] = (parsed.alerts || []).slice(0, 3).map(
      (a: Record<string, unknown>, i: number) => ({
        id: `alert-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        severity: a.severity || 'info',
        title: a.title || 'Market Alert',
        summary: a.summary || '',
        analysis: a.analysis || '',
        tickers: Array.isArray(a.tickers) ? a.tickers : [],
        triggers: Array.isArray(a.triggers) ? a.triggers : [],
        recommendation: (a.recommendation as string) || '',
        confidence: typeof a.confidence === 'number' ? a.confidence : 50,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1hr
        category: a.category || 'news',
      })
    );

    const regime: MarketRegime = parsed.regime
      ? {
          current: parsed.regime.current || memory.getRegime().current,
          previous: memory.getRegime().current,
          changedAt: parsed.regime.current !== memory.getRegime().current
            ? new Date().toISOString()
            : memory.getRegime().changedAt,
          confidence: parsed.regime.confidence || memory.getRegime().confidence,
          indicators: parsed.regime.indicators || [],
        }
      : memory.getRegime();

    return { alerts, regime };
  } catch (error) {
    console.error('[Monitor] Analysis failed:', error);
    return { alerts: [], regime: memory.getRegime() };
  }
}

// ---------------------------------------------------------------------------
// Intelligence Report Generator
// ---------------------------------------------------------------------------

async function generateIntelligenceReport(
  memory: MonitorMemory,
  type: IntelligenceReport['type'] = 'hourly-brief'
): Promise<IntelligenceReport | null> {
  const config = getAIConfigOrNull();
  if (!config) return null;

  const context = memory.buildContextWindow();
  const recentAlerts = memory.getRecentAlerts(10);

  const system = `You are generating a structured intelligence report for crypto market professionals.

OUTPUT JSON:
{
  "title": "Report title",
  "executive_summary": "3-4 sentences summarizing the key findings",
  "sections": [
    { "heading": "Section heading", "content": "2-3 paragraphs of analysis" }
  ]
}

Include 3-5 sections. Be specific, reference data.
RULES: JSON only, no markdown.`;

  const user = `Generate a "${type}" intelligence report.

CONTEXT:
${context}

RECENT ALERTS:
${recentAlerts.map(a => `[${a.severity}] ${a.title}: ${a.analysis}`).join('\n') || 'None'}`;

  try {
    const raw = await aiComplete(system, user, {
      maxTokens: 3000,
      temperature: 0.5,
      jsonMode: true,
    });

    const parsed = JSON.parse(raw);

    return {
      id: `report-${type}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      title: parsed.title || `${type} Report`,
      executive_summary: parsed.executive_summary || '',
      sections: (parsed.sections || []).map((s: Record<string, unknown>) => ({
        heading: s.heading || '',
        content: s.content || '',
      })),
      alerts: recentAlerts,
      regime: memory.getRegime(),
      metrics: memory.getMetrics(),
    };
  } catch (error) {
    console.error('[Monitor] Report generation failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main Monitor Class
// ---------------------------------------------------------------------------

export class AutonomousMarketMonitor {
  private memory: MonitorMemory;
  private state: MonitorState = 'idle';
  private observeTimer: ReturnType<typeof setInterval> | null = null;
  private analyzeTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, ((event: MonitorAlert | IntelligenceReport) => void)[]> = new Map();
  private startedAt: number = 0;

  constructor() {
    this.memory = new MonitorMemory();
  }

  getState(): MonitorState { return this.state; }
  getMetrics(): MonitorMetrics { return this.memory.getMetrics(); }
  getRegime(): MarketRegime { return this.memory.getRegime(); }
  getRecentAlerts(n = 10): MonitorAlert[] { return this.memory.getRecentAlerts(n); }
  getRecentReports(n = 5): IntelligenceReport[] { return this.memory.getRecentReports(n); }

  /**
   * Start the autonomous monitoring loop.
   * @param observeIntervalMs How often to collect observations (default: 60s)
   * @param analyzeIntervalMs How often to run AI analysis (default: 5min)
   */
  start(observeIntervalMs = 60000, analyzeIntervalMs = 300000) {
    if (this.state !== 'idle') return;

    this.state = 'observing';
    this.startedAt = Date.now();
    console.log('[Monitor] Autonomous market monitor started');

    // Observation loop
    this.runObservationCycle(); // immediate first run
    this.observeTimer = setInterval(() => this.runObservationCycle(), observeIntervalMs);

    // Analysis loop
    setTimeout(() => this.runAnalysisCycle(), 10000); // first analysis after 10s
    this.analyzeTimer = setInterval(() => this.runAnalysisCycle(), analyzeIntervalMs);
  }

  stop() {
    if (this.observeTimer) clearInterval(this.observeTimer);
    if (this.analyzeTimer) clearInterval(this.analyzeTimer);
    this.observeTimer = null;
    this.analyzeTimer = null;
    this.state = 'idle';
    console.log('[Monitor] Autonomous market monitor stopped');
  }

  on(event: 'alert' | 'report', callback: (data: MonitorAlert | IntelligenceReport) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: MonitorAlert | IntelligenceReport) {
    const listeners = this.listeners.get(event) || [];
    for (const cb of listeners) {
      try { cb(data); } catch (e) { console.error('[Monitor] Listener error:', e); }
    }
  }

  private async runObservationCycle() {
    const prevState = this.state;
    this.state = 'observing';

    try {
      const observations = await collectObservations();
      const snapshot = await buildMarketSnapshot();

      this.memory.addSnapshot(snapshot);
      for (const obs of observations) {
        this.memory.addObservation(obs);
      }
    } catch (error) {
      console.error('[Monitor] Observation cycle error:', error);
    }

    this.state = prevState === 'analyzing' ? 'analyzing' : 'observing';
  }

  private async runAnalysisCycle() {
    this.state = 'analyzing';

    try {
      const { alerts, regime } = await analyzeObservations(this.memory);

      // Update regime
      this.memory.setRegime(regime);

      // Process alerts
      for (const alert of alerts) {
        this.memory.addAlert(alert);
        this.emit('alert', alert);
      }

      // Mark observations as processed
      const unprocessed = this.memory.getUnprocessedObservations();
      this.memory.markProcessed(unprocessed.map(o => o.id));
      this.memory.incrementCycles();

      // Generate hourly report every 12 cycles (~1hr at 5min intervals)
      if (this.memory.getMetrics().cyclesCompleted % 12 === 0) {
        this.state = 'alerting';
        const report = await generateIntelligenceReport(this.memory, 'hourly-brief');
        if (report) {
          this.memory.addReport(report);
          this.emit('report', report);
        }
      }
    } catch (error) {
      console.error('[Monitor] Analysis cycle error:', error);
    }

    this.state = 'observing';
  }

  /**
   * Force-generate an intelligence report on demand.
   */
  async generateReport(
    type: IntelligenceReport['type'] = 'hourly-brief'
  ): Promise<IntelligenceReport | null> {
    // Run a fresh observation first
    await this.runObservationCycle();
    return generateIntelligenceReport(this.memory, type);
  }

  /**
   * Get the full monitoring status for API/dashboard consumption.
   */
  getStatus() {
    return {
      state: this.state,
      regime: this.memory.getRegime(),
      metrics: {
        ...this.memory.getMetrics(),
        uptime: this.startedAt ? Date.now() - this.startedAt : 0,
      },
      recentAlerts: this.memory.getRecentAlerts(5),
      recentReports: this.memory.getRecentReports(3).map(r => ({
        id: r.id,
        type: r.type,
        title: r.title,
        executive_summary: r.executive_summary,
        timestamp: r.timestamp,
      })),
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let monitorInstance: AutonomousMarketMonitor | null = null;

export function getMarketMonitor(): AutonomousMarketMonitor {
  if (!monitorInstance) {
    monitorInstance = new AutonomousMarketMonitor();
  }
  return monitorInstance;
}
