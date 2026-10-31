/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest } from 'next/server';
import {
  ingestDataPoint,
  getAnomalyDashboard,
  getAnomalyHistory,
  acknowledgeAnomaly,
  markFalsePositive,
  addAlertRule,
  removeAlertRule,
  getAlertRules,
} from '@/lib/advanced-anomaly';
import type { AnomalySignal, AnomalySeverity } from '@/lib/advanced-anomaly';
import { jsonResponse, errorResponse, withTiming, CACHE_CONTROL } from '@/lib/api-utils';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';

/** Valid anomaly signals for type-safe casting */
const VALID_SIGNALS = new Set<string>([
  'news-velocity', 'sentiment-acceleration', 'source-concentration',
  'entity-cooccurrence', 'price-narrative-divergence', 'social-amplification',
  'volume-spike', 'whale-activity', 'correlation-break',
]);

function isValidSignal(s: string): s is AnomalySignal {
  return VALID_SIGNALS.has(s);
}

/**
 * GET /api/anomalies
 * Anomaly detection dashboard and history
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Dashboard overview
  if (!action || action === 'dashboard') {
    const dashboard = getAnomalyDashboard();
    return jsonResponse(withTiming({
      success: true,
      action: 'dashboard',
      ...dashboard,
    }, startTime), {
      cacheControl: CACHE_CONTROL.realtime,
    });
  }

  // Historical anomaly log
  if (action === 'history') {
    const limit = intParam(searchParams, 'limit', { fallback: 50, min: 1, max: 500 });
    const signalParam = searchParams.get('signal') || undefined;
    const severityParam = searchParams.get('severity') || undefined;
    const sinceParam = searchParams.get('since') || undefined;
    const history = getAnomalyHistory({
      signal: signalParam && isValidSignal(signalParam) ? signalParam : undefined,
      minSeverity: severityParam as AnomalySeverity | undefined,
      since: sinceParam ? new Date(sinceParam).getTime() : undefined,
      limit: Math.min(limit, 500),
    });
    return jsonResponse(withTiming({
      success: true,
      action: 'history',
      anomalies: history,
      count: history.length,
      filters: { signal: signalParam, severity: severityParam, since: sinceParam, limit },
    }, startTime), {
      cacheControl: CACHE_CONTROL.realtime,
    });
  }

  // Alert rules
  if (action === 'rules') {
    const rules = getAlertRules();
    return jsonResponse(withTiming({
      success: true,
      action: 'rules',
      rules,
      count: rules.length,
    }, startTime), {
      cacheControl: CACHE_CONTROL.standard,
    });
  }

  // API docs
  return jsonResponse(withTiming({
    endpoint: '/api/anomalies',
    description: 'ML-enhanced anomaly detection across crypto market signals with 5 statistical algorithms + AI interpretation',
    methods: {
      GET: {
        params: {
          action: 'dashboard | history | rules',
          signal: '(optional) Filter by signal name (e.g., btc_price, eth_volume)',
          limit: '(history) Max results (default: 50, max: 500)',
          severity: '(history) Filter: low | medium | high | critical',
          since: '(history) ISO8601 date: only anomalies after this date',
        },
      },
      POST: {
        description: 'Ingest data, manage anomalies and alert rules',
        body: {
          action: 'ingest | acknowledge | false-positive | add-rule | remove-rule',
          signal: '(ingest) Signal name',
          value: '(ingest) Numeric value',
          metadata: '(ingest) Optional context object',
          anomalyId: '(acknowledge/false-positive) Anomaly ID',
          rule: '(add-rule) { signal, severity, webhook?, cooldownMs? }',
          ruleId: '(remove-rule) Rule ID to remove',
        },
      },
    },
    algorithms: [
      'Z-Score: Statistical deviation from rolling mean',
      'EWMA: Exponentially Weighted Moving Average with dynamic bands',
      'CUSUM: Cumulative sum change-point detection',
      'Isolation Forest: Tree-based outlier scoring',
      'Cross-Signal Correlation: Multi-signal pattern analysis',
    ],
    features: [
      'Real-time signal ingestion and monitoring',
      'Severity classification: low → medium → high → critical',
      'AI-powered anomaly interpretation for high-severity events',
      'False positive tracking and model calibration',
      'Configurable alert rules with cooldown periods',
      'Historical anomaly log with filtering',
    ],
  }, startTime), {
    cacheControl: CACHE_CONTROL.standard,
  });
}

/**
 * POST /api/anomalies
 * Ingest data points and manage anomaly lifecycle
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    // Ingest a data point
    if (action === 'ingest') {
      const { signal, value, metadata } = body as {
        signal?: string;
        value?: number;
        metadata?: { entities?: string[]; regime?: string; additionalMetrics?: Record<string, number> };
      };

      if (!signal || typeof signal !== 'string' || !isValidSignal(signal)) {
        return errorResponse(`signal must be one of: ${[...VALID_SIGNALS].join(', ')}`, undefined, 400);
      }
      if (value === undefined || typeof value !== 'number') {
        return errorResponse('value (number) is required', undefined, 400);
      }

      const result = await ingestDataPoint(signal, value, metadata);

      return jsonResponse(withTiming({
        success: true,
        action: 'ingest',
        signal,
        value,
        anomalyDetected: result !== null,
        anomaly: result,
      }, startTime));
    }

    // Batch ingest multiple data points
    if (action === 'batch-ingest') {
      const { dataPoints } = body as {
        dataPoints?: Array<{ signal: string; value: number; metadata?: { entities?: string[]; regime?: string } }>;
      };

      if (!dataPoints || !Array.isArray(dataPoints) || dataPoints.length === 0) {
        return errorResponse('dataPoints array is required', undefined, 400);
      }

      if (dataPoints.length > 100) {
        return errorResponse('Maximum 100 data points per batch', undefined, 400);
      }

      const results = await Promise.all(
        dataPoints
          .filter((dp) => isValidSignal(dp.signal))
          .map((dp) => ingestDataPoint(dp.signal as AnomalySignal, dp.value, dp.metadata))
      );

      const anomalyCount = results.filter((r) => r !== null).length;

      return jsonResponse(withTiming({
        success: true,
        action: 'batch-ingest',
        processed: dataPoints.length,
        anomaliesDetected: anomalyCount,
        anomalies: results.filter((r) => r !== null),
      }, startTime));
    }

    // Acknowledge an anomaly
    if (action === 'acknowledge') {
      const { anomalyId } = body as { anomalyId?: string };
      if (!anomalyId) return errorResponse('anomalyId is required', undefined, 400);

      const result = acknowledgeAnomaly(anomalyId);
      return jsonResponse(withTiming({
        success: true,
        action: 'acknowledge',
        anomalyId,
        acknowledged: result,
      }, startTime));
    }

    // Mark as false positive
    if (action === 'false-positive') {
      const { anomalyId } = body as { anomalyId?: string };
      if (!anomalyId) return errorResponse('anomalyId is required', undefined, 400);

      const result = markFalsePositive(anomalyId);
      return jsonResponse(withTiming({
        success: true,
        action: 'false-positive',
        anomalyId,
        marked: result,
      }, startTime));
    }

    // Add alert rule
    if (action === 'add-rule') {
      const { rule } = body as {
        rule?: {
          signal: string;
          minSeverity: string;
          cooldownMinutes?: number;
          enabled?: boolean;
          notifyChannels?: string[];
        };
      };

      if (!rule?.signal || !rule.minSeverity) {
        return errorResponse('rule with signal and minSeverity is required', undefined, 400);
      }

      if (!isValidSignal(rule.signal)) {
        return errorResponse(`Invalid signal. Must be one of: ${[...VALID_SIGNALS].join(', ')}`, undefined, 400);
      }

      const newRule = addAlertRule({
        signal: rule.signal as AnomalySignal,
        minSeverity: rule.minSeverity as AnomalySeverity,
        cooldownMinutes: rule.cooldownMinutes ?? 30,
        enabled: rule.enabled ?? true,
        notifyChannels: rule.notifyChannels ?? [],
      });
      return jsonResponse(withTiming({
        success: true,
        action: 'add-rule',
        rule: newRule,
      }, startTime));
    }

    // Remove alert rule
    if (action === 'remove-rule') {
      const { ruleId } = body as { ruleId?: string };
      if (!ruleId) return errorResponse('ruleId is required', undefined, 400);

      const result = removeAlertRule(ruleId);
      return jsonResponse(withTiming({
        success: true,
        action: 'remove-rule',
        ruleId,
        removed: result,
      }, startTime));
    }

    return errorResponse(
      'Unknown action. Use: ingest, batch-ingest, acknowledge, false-positive, add-rule, remove-rule',
      undefined,
      400
    );
  } catch (error) {
    console.error('anomalies POST error:', error);
    return errorResponse('Request failed', undefined, 500);
  }
}
