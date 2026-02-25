/**
 * AI Cost Dashboard API
 *
 * Tracks and reports AI spending across all providers. Essential when
 * operating with significant AI credits ($100k+ GCP, unlimited Anthropic).
 *
 * Features:
 *   - Per-provider cost tracking (tokens in, tokens out, cost USD)
 *   - Per-feature attribution (which features consume the most AI?)
 *   - Real-time budget monitoring with alerts
 *   - Historical trend analysis
 *   - Cost optimization recommendations
 *   - Projected monthly spend
 *
 * API Endpoint: GET /api/admin/ai-costs
 *
 * @module ai-cost-dashboard
 */

import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CostEntry {
  timestamp: number;
  provider: string;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  costMicroUsd: number;
  latencyMs: number;
  cached: boolean;
}

export interface ProviderSummary {
  provider: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  cacheHitRate: number;
  models: Record<string, {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    avgLatencyMs: number;
  }>;
}

export interface FeatureSummary {
  feature: string;
  totalRequests: number;
  totalCostUsd: number;
  avgCostPerRequest: number;
  avgLatencyMs: number;
  topProvider: string;
}

export interface CostDashboard {
  period: { start: string; end: string };
  totalCostUsd: number;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  providers: ProviderSummary[];
  features: FeatureSummary[];
  hourlySpend: Array<{ hour: string; costUsd: number; requests: number }>;
  projectedMonthlyCostUsd: number;
  budget: {
    monthlyLimitUsd: number;
    currentSpendUsd: number;
    remainingUsd: number;
    percentUsed: number;
    daysRemaining: number;
    projectedOverage: number;
  };
  optimization: CostOptimization[];
  topExpensiveRequests: Array<{
    feature: string;
    model: string;
    costUsd: number;
    tokens: number;
    timestamp: string;
  }>;
}

export interface CostOptimization {
  type: 'model-switch' | 'cache-improvement' | 'prompt-compression' | 'batch-opportunity';
  description: string;
  estimatedSavingsUsd: number;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Cost Pricing Table (per 1M tokens)
// ---------------------------------------------------------------------------

const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'o1': { input: 15, output: 60 },
  'o1-mini': { input: 3, output: 12 },

  // Anthropic
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-3-opus-20240229': { input: 15, output: 75 },

  // Google Gemini
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-2.0-flash-lite': { input: 0.025, output: 0.10 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  'gemini-1.5-pro': { input: 1.25, output: 5 },

  // Groq
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },

  // OpenRouter defaults
  'meta-llama/llama-3.3-70b-instruct': { input: 0.59, output: 0.79 },
};

// ---------------------------------------------------------------------------
// Cost Tracker (in-memory, suitable for single-instance)
// ---------------------------------------------------------------------------

export class AICostTracker {
  private entries: CostEntry[] = [];
  private maxEntries: number;
  private monthlyBudgetUsd: number;

  constructor(options?: { maxEntries?: number; monthlyBudgetUsd?: number }) {
    this.maxEntries = options?.maxEntries ?? 100_000;
    this.monthlyBudgetUsd = options?.monthlyBudgetUsd ?? parseFloat(process.env.AI_MONTHLY_BUDGET_USD || '10000');
  }

  /**
   * Record an AI API call cost.
   */
  record(entry: Omit<CostEntry, 'costMicroUsd'> & { costMicroUsd?: number }): void {
    // Auto-calculate cost if not provided
    let costMicroUsd = entry.costMicroUsd;
    if (costMicroUsd === undefined) {
      const pricing = PRICING[entry.model] ?? { input: 1, output: 2 };
      const inputCost = (entry.inputTokens / 1_000_000) * pricing.input;
      const outputCost = (entry.outputTokens / 1_000_000) * pricing.output;
      costMicroUsd = Math.round((inputCost + outputCost) * 1_000_000);
    }

    const fullEntry: CostEntry = { ...entry, costMicroUsd };
    this.entries.push(fullEntry);

    // Evict old entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  /**
   * Generate the full cost dashboard.
   */
  getDashboard(periodHours = 24): CostDashboard {
    const now = Date.now();
    const periodStart = now - periodHours * 60 * 60 * 1000;
    const periodEntries = this.entries.filter((e) => e.timestamp >= periodStart);

    // Provider summaries
    const providerMap = new Map<string, CostEntry[]>();
    for (const entry of periodEntries) {
      const existing = providerMap.get(entry.provider) || [];
      existing.push(entry);
      providerMap.set(entry.provider, existing);
    }

    const providers: ProviderSummary[] = [...providerMap.entries()].map(([provider, entries]) => {
      const models: Record<string, { requests: number; inputTokens: number; outputTokens: number; costUsd: number; avgLatencyMs: number }> = {};

      for (const e of entries) {
        if (!models[e.model]) {
          models[e.model] = { requests: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, avgLatencyMs: 0 };
        }
        const m = models[e.model];
        m.requests++;
        m.inputTokens += e.inputTokens;
        m.outputTokens += e.outputTokens;
        m.costUsd += e.costMicroUsd / 1_000_000;
        m.avgLatencyMs = (m.avgLatencyMs * (m.requests - 1) + e.latencyMs) / m.requests;
      }

      const totalCost = entries.reduce((sum, e) => sum + e.costMicroUsd, 0) / 1_000_000;
      const cachedEntries = entries.filter((e) => e.cached).length;

      return {
        provider,
        totalRequests: entries.length,
        totalInputTokens: entries.reduce((sum, e) => sum + e.inputTokens, 0),
        totalOutputTokens: entries.reduce((sum, e) => sum + e.outputTokens, 0),
        totalCostUsd: totalCost,
        avgLatencyMs: entries.reduce((sum, e) => sum + e.latencyMs, 0) / entries.length || 0,
        cacheHitRate: entries.length > 0 ? cachedEntries / entries.length : 0,
        models,
      };
    });

    // Feature summaries
    const featureMap = new Map<string, CostEntry[]>();
    for (const entry of periodEntries) {
      const existing = featureMap.get(entry.feature) || [];
      existing.push(entry);
      featureMap.set(entry.feature, existing);
    }

    const features: FeatureSummary[] = [...featureMap.entries()].map(([feature, entries]) => {
      const totalCost = entries.reduce((sum, e) => sum + e.costMicroUsd, 0) / 1_000_000;
      const providerCounts = new Map<string, number>();
      for (const e of entries) {
        providerCounts.set(e.provider, (providerCounts.get(e.provider) || 0) + 1);
      }
      const topProvider = [...providerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';

      return {
        feature,
        totalRequests: entries.length,
        totalCostUsd: totalCost,
        avgCostPerRequest: entries.length > 0 ? totalCost / entries.length : 0,
        avgLatencyMs: entries.reduce((sum, e) => sum + e.latencyMs, 0) / entries.length || 0,
        topProvider,
      };
    }).sort((a, b) => b.totalCostUsd - a.totalCostUsd);

    // Hourly spend
    const hourlyMap = new Map<string, { costUsd: number; requests: number }>();
    for (const entry of periodEntries) {
      const hour = new Date(entry.timestamp).toISOString().slice(0, 13) + ':00:00Z';
      const existing = hourlyMap.get(hour) || { costUsd: 0, requests: 0 };
      existing.costUsd += entry.costMicroUsd / 1_000_000;
      existing.requests++;
      hourlyMap.set(hour, existing);
    }

    const hourlySpend = [...hourlyMap.entries()]
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // Budget calculation
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthEntries = this.entries.filter((e) => e.timestamp >= monthStart.getTime());
    const currentMonthSpend = monthEntries.reduce((sum, e) => sum + e.costMicroUsd, 0) / 1_000_000;

    const dayOfMonth = new Date().getUTCDate();
    const daysInMonth = new Date(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 0).getUTCDate();
    const daysRemaining = daysInMonth - dayOfMonth;
    const dailyRate = dayOfMonth > 0 ? currentMonthSpend / dayOfMonth : 0;
    const projectedMonthly = dailyRate * daysInMonth;

    // Totals
    const totalCostUsd = periodEntries.reduce((sum, e) => sum + e.costMicroUsd, 0) / 1_000_000;

    // Top expensive requests
    const topExpensive = [...periodEntries]
      .sort((a, b) => b.costMicroUsd - a.costMicroUsd)
      .slice(0, 10)
      .map((e) => ({
        feature: e.feature,
        model: e.model,
        costUsd: e.costMicroUsd / 1_000_000,
        tokens: e.inputTokens + e.outputTokens,
        timestamp: new Date(e.timestamp).toISOString(),
      }));

    // Optimization recommendations
    const optimization = this.generateOptimizations(periodEntries, providers, features);

    return {
      period: {
        start: new Date(periodStart).toISOString(),
        end: new Date(now).toISOString(),
      },
      totalCostUsd,
      totalRequests: periodEntries.length,
      totalInputTokens: periodEntries.reduce((sum, e) => sum + e.inputTokens, 0),
      totalOutputTokens: periodEntries.reduce((sum, e) => sum + e.outputTokens, 0),
      providers,
      features,
      hourlySpend,
      projectedMonthlyCostUsd: projectedMonthly,
      budget: {
        monthlyLimitUsd: this.monthlyBudgetUsd,
        currentSpendUsd: currentMonthSpend,
        remainingUsd: Math.max(0, this.monthlyBudgetUsd - currentMonthSpend),
        percentUsed: this.monthlyBudgetUsd > 0 ? (currentMonthSpend / this.monthlyBudgetUsd) * 100 : 0,
        daysRemaining,
        projectedOverage: Math.max(0, projectedMonthly - this.monthlyBudgetUsd),
      },
      optimization,
      topExpensiveRequests: topExpensive,
    };
  }

  /**
   * Generate cost optimization recommendations.
   */
  private generateOptimizations(
    entries: CostEntry[],
    providers: ProviderSummary[],
    features: FeatureSummary[],
  ): CostOptimization[] {
    const optimizations: CostOptimization[] = [];

    // Check if expensive models could be replaced with cheaper ones
    for (const provider of providers) {
      for (const [model, stats] of Object.entries(provider.models)) {
        const pricing = PRICING[model];
        if (!pricing) continue;

        // If using GPT-4o for simple tasks, suggest GPT-4o-mini
        if (model === 'gpt-4o' && stats.requests > 10) {
          const savings = stats.costUsd * 0.85; // 4o-mini is ~85% cheaper
          optimizations.push({
            type: 'model-switch',
            description: `Switch ${stats.requests} requests from gpt-4o to gpt-4o-mini for non-complex tasks`,
            estimatedSavingsUsd: savings,
            confidence: 0.7,
          });
        }

        // If using Claude Opus, suggest Sonnet
        if (model.includes('opus') && stats.requests > 5) {
          const savings = stats.costUsd * 0.8;
          optimizations.push({
            type: 'model-switch',
            description: `Switch ${stats.requests} requests from Claude Opus to Sonnet for routine analysis`,
            estimatedSavingsUsd: savings,
            confidence: 0.6,
          });
        }

        // If using Gemini Pro, suggest Flash
        if (model.includes('gemini') && model.includes('pro') && stats.requests > 10) {
          const savings = stats.costUsd * 0.9;
          optimizations.push({
            type: 'model-switch',
            description: `Switch ${stats.requests} Gemini Pro requests to Flash for speed-sensitive tasks`,
            estimatedSavingsUsd: savings,
            confidence: 0.8,
          });
        }
      }
    }

    // Check cache hit rates
    for (const provider of providers) {
      if (provider.cacheHitRate < 0.3 && provider.totalRequests > 50) {
        const potentialSavings = provider.totalCostUsd * 0.4;
        optimizations.push({
          type: 'cache-improvement',
          description: `${provider.provider} cache hit rate is ${(provider.cacheHitRate * 100).toFixed(0)}%. Improving to 50% could save $${potentialSavings.toFixed(2)}`,
          estimatedSavingsUsd: potentialSavings,
          confidence: 0.5,
        });
      }
    }

    // Check for batchable requests
    for (const feature of features) {
      if (feature.totalRequests > 20 && feature.avgCostPerRequest < 0.01) {
        optimizations.push({
          type: 'batch-opportunity',
          description: `${feature.feature}: ${feature.totalRequests} small requests could be batched to reduce overhead`,
          estimatedSavingsUsd: feature.totalCostUsd * 0.3,
          confidence: 0.4,
        });
      }
    }

    return optimizations.sort((a, b) => b.estimatedSavingsUsd - a.estimatedSavingsUsd);
  }

  /**
   * Get raw entry count.
   */
  getEntryCount(): number {
    return this.entries.length;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _tracker: AICostTracker | null = null;

export function getAICostTracker(): AICostTracker {
  if (!_tracker) _tracker = new AICostTracker();
  return _tracker;
}

// ---------------------------------------------------------------------------
// API Route Handler
// ---------------------------------------------------------------------------

/**
 * GET /api/admin/ai-costs — Returns the cost dashboard.
 *
 * Query params:
 *   hours (default 24) — lookback period
 *
 * Protected by admin auth (check in middleware).
 */
export async function handleAICostsRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const hours = parseInt(url.searchParams.get('hours') ?? '24', 10);

  const tracker = getAICostTracker();
  const dashboard = tracker.getDashboard(hours);

  return NextResponse.json(dashboard, {
    headers: {
      'Cache-Control': 'private, no-cache',
      'X-Cost-Total-USD': dashboard.totalCostUsd.toFixed(4),
      'X-Budget-Remaining-USD': dashboard.budget.remainingUsd.toFixed(2),
    },
  });
}
