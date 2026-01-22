/**
 * Alert Rule Definitions
 *
 * Type definitions for the configurable alert system supporting
 * price movements, breaking news, and custom conditions.
 *
 * @module alert-rules
 */

// =============================================================================
// ALERT CONDITION TYPES
// =============================================================================

/**
 * Price above threshold condition
 */
export interface PriceAboveCondition {
  type: 'price_above';
  coin: string;
  threshold: number;
}

/**
 * Price below threshold condition
 */
export interface PriceBelowCondition {
  type: 'price_below';
  coin: string;
  threshold: number;
}

/**
 * Price change percentage condition
 */
export interface PriceChangeCondition {
  type: 'price_change_pct';
  coin: string;
  threshold: number;
  timeframe: '1h' | '24h';
}

/**
 * Volume spike condition
 */
export interface VolumeSpikeCondition {
  type: 'volume_spike';
  coin: string;
  multiplier: number;
}

/**
 * Breaking news condition with optional keyword filtering
 */
export interface BreakingNewsCondition {
  type: 'breaking_news';
  keywords?: string[];
}

/**
 * Ticker mention condition with optional sentiment filtering
 */
export interface TickerMentionCondition {
  type: 'ticker_mention';
  ticker: string;
  minSentiment?: number;
}

/**
 * Whale movement condition
 */
export interface WhaleMovementCondition {
  type: 'whale_movement';
  minUSD: number;
}

/**
 * Fear & Greed index change condition
 */
export interface FearGreedChangeCondition {
  type: 'fear_greed_change';
  threshold: number;
}

/**
 * Union type for all alert conditions
 */
export type AlertCondition =
  | PriceAboveCondition
  | PriceBelowCondition
  | PriceChangeCondition
  | VolumeSpikeCondition
  | BreakingNewsCondition
  | TickerMentionCondition
  | WhaleMovementCondition
  | FearGreedChangeCondition;

// =============================================================================
// ALERT RULE
// =============================================================================

/**
 * Available notification channels
 */
export type AlertChannel = 'websocket' | 'webhook';

/**
 * Alert rule configuration
 */
export interface AlertRule {
  /** Unique identifier */
  id: string;
  /** Human-readable name for the alert */
  name: string;
  /** Condition that triggers the alert */
  condition: AlertCondition;
  /** Channels to deliver notifications */
  channels: AlertChannel[];
  /** Optional webhook URL for webhook channel */
  webhookUrl?: string;
  /** Minimum seconds between triggers (cooldown) */
  cooldown: number;
  /** Whether the alert is active */
  enabled: boolean;
  /** When the alert was created */
  createdAt: string;
  /** When the alert was last triggered */
  lastTriggered?: string;
}

// =============================================================================
// ALERT EVENT
// =============================================================================

/**
 * Alert severity levels
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Data payload for triggered alerts
 */
export interface AlertEventData {
  /** Current value that triggered the alert */
  currentValue: number | string;
  /** Threshold value from the condition */
  threshold: number | string;
  /** Additional context data */
  context?: Record<string, unknown>;
}

/**
 * Alert event generated when a rule triggers
 */
export interface AlertEvent {
  /** Unique identifier for this event */
  id: string;
  /** ID of the rule that triggered */
  ruleId: string;
  /** Name of the rule that triggered */
  ruleName: string;
  /** The condition that was matched */
  condition: AlertCondition;
  /** When the alert was triggered */
  triggeredAt: string;
  /** Data about the trigger */
  data: AlertEventData;
  /** Severity level */
  severity: AlertSeverity;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the condition type as a human-readable string
 */
export function getConditionDescription(condition: AlertCondition): string {
  switch (condition.type) {
    case 'price_above':
      return `${condition.coin} price above $${condition.threshold.toLocaleString()}`;
    case 'price_below':
      return `${condition.coin} price below $${condition.threshold.toLocaleString()}`;
    case 'price_change_pct':
      return `${condition.coin} price change ${condition.threshold > 0 ? '+' : ''}${condition.threshold}% in ${condition.timeframe}`;
    case 'volume_spike':
      return `${condition.coin} volume spike ${condition.multiplier}x`;
    case 'breaking_news':
      return condition.keywords?.length
        ? `Breaking news with keywords: ${condition.keywords.join(', ')}`
        : 'Any breaking news';
    case 'ticker_mention':
      return condition.minSentiment !== undefined
        ? `${condition.ticker} mention with sentiment >= ${condition.minSentiment}`
        : `${condition.ticker} mentioned in news`;
    case 'whale_movement':
      return `Whale movement >= $${condition.minUSD.toLocaleString()}`;
    case 'fear_greed_change':
      return `Fear & Greed index change >= ${condition.threshold} points`;
    default:
      return 'Unknown condition';
  }
}

/**
 * Determine alert severity based on condition type and values
 */
export function determineSeverity(
  condition: AlertCondition,
  currentValue: number | string,
  threshold: number | string
): AlertSeverity {
  switch (condition.type) {
    case 'price_above':
    case 'price_below': {
      const pctDiff = Math.abs(
        ((Number(currentValue) - Number(threshold)) / Number(threshold)) * 100
      );
      if (pctDiff >= 10) return 'critical';
      if (pctDiff >= 5) return 'warning';
      return 'info';
    }
    case 'price_change_pct': {
      const change = Math.abs(Number(currentValue));
      if (change >= 20) return 'critical';
      if (change >= 10) return 'warning';
      return 'info';
    }
    case 'volume_spike': {
      const multiplier = Number(currentValue);
      if (multiplier >= 5) return 'critical';
      if (multiplier >= 3) return 'warning';
      return 'info';
    }
    case 'breaking_news':
      return 'warning';
    case 'ticker_mention':
      return 'info';
    case 'whale_movement': {
      const usd = Number(currentValue);
      if (usd >= 100_000_000) return 'critical';
      if (usd >= 50_000_000) return 'warning';
      return 'info';
    }
    case 'fear_greed_change': {
      const change = Math.abs(Number(currentValue));
      if (change >= 20) return 'critical';
      if (change >= 10) return 'warning';
      return 'info';
    }
    default:
      return 'info';
  }
}

/**
 * Validate an alert condition
 */
export function validateCondition(condition: AlertCondition): { valid: boolean; error?: string } {
  if (!condition || typeof condition !== 'object') {
    return { valid: false, error: 'Condition must be an object' };
  }

  switch (condition.type) {
    case 'price_above':
    case 'price_below':
      if (!condition.coin || typeof condition.coin !== 'string') {
        return { valid: false, error: 'Coin is required' };
      }
      if (typeof condition.threshold !== 'number' || condition.threshold <= 0) {
        return { valid: false, error: 'Threshold must be a positive number' };
      }
      break;

    case 'price_change_pct':
      if (!condition.coin || typeof condition.coin !== 'string') {
        return { valid: false, error: 'Coin is required' };
      }
      if (typeof condition.threshold !== 'number') {
        return { valid: false, error: 'Threshold must be a number' };
      }
      if (!['1h', '24h'].includes(condition.timeframe)) {
        return { valid: false, error: 'Timeframe must be "1h" or "24h"' };
      }
      break;

    case 'volume_spike':
      if (!condition.coin || typeof condition.coin !== 'string') {
        return { valid: false, error: 'Coin is required' };
      }
      if (typeof condition.multiplier !== 'number' || condition.multiplier <= 1) {
        return { valid: false, error: 'Multiplier must be greater than 1' };
      }
      break;

    case 'breaking_news':
      if (condition.keywords && !Array.isArray(condition.keywords)) {
        return { valid: false, error: 'Keywords must be an array' };
      }
      break;

    case 'ticker_mention':
      if (!condition.ticker || typeof condition.ticker !== 'string') {
        return { valid: false, error: 'Ticker is required' };
      }
      if (
        condition.minSentiment !== undefined &&
        (typeof condition.minSentiment !== 'number' ||
          condition.minSentiment < -1 ||
          condition.minSentiment > 1)
      ) {
        return { valid: false, error: 'minSentiment must be between -1 and 1' };
      }
      break;

    case 'whale_movement':
      if (typeof condition.minUSD !== 'number' || condition.minUSD <= 0) {
        return { valid: false, error: 'minUSD must be a positive number' };
      }
      break;

    case 'fear_greed_change':
      if (typeof condition.threshold !== 'number' || condition.threshold <= 0) {
        return { valid: false, error: 'Threshold must be a positive number' };
      }
      break;

    default:
      return { valid: false, error: `Unknown condition type: ${(condition as AlertCondition).type}` };
  }

  return { valid: true };
}

/**
 * Generate a unique alert ID
 */
export function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate a unique event ID
 */
export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
