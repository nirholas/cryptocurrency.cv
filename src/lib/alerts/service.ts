/**
 * Price Alerts Service
 * 
 * Handles price alert management with Vercel KV storage.
 * Features:
 * - Create price alerts (above/below threshold)
 * - Percentage change alerts
 * - Alert triggering and notification
 * - Alert history
 */

import { kv } from '@vercel/kv';

// =============================================================================
// Types
// =============================================================================

export type AlertType = 'price_above' | 'price_below' | 'percent_change' | 'volume_spike';
export type AlertStatus = 'active' | 'triggered' | 'expired' | 'cancelled';
export type NotificationChannel = 'email' | 'push' | 'webhook' | 'none';

export interface PriceAlert {
  id: string;
  userId: string;
  coinId: string;
  symbol: string;
  name: string;
  type: AlertType;
  threshold: number;
  currentPriceAtCreation: number;
  status: AlertStatus;
  createdAt: string;
  triggeredAt?: string;
  triggeredPrice?: number;
  expiresAt?: string;
  notificationChannel: NotificationChannel;
  webhookUrl?: string;
  email?: string;
  notes?: string;
  repeatCount: number;
  maxRepeats: number;
}

export interface AlertTriggerResult {
  alert: PriceAlert;
  triggered: boolean;
  currentPrice: number;
  message: string;
}

export interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  triggeredAlerts: number;
  alertsByType: Record<AlertType, number>;
}

// =============================================================================
// Storage Keys
// =============================================================================

const getAlertsKey = (userId: string) => `alerts:${userId}`;
const getAlertByIdKey = (alertId: string) => `alert:${alertId}`;
const getActiveAlertsIndexKey = () => `alerts:active:index`;

// =============================================================================
// In-Memory Fallback (Development)
// =============================================================================

const inMemoryAlerts = new Map<string, PriceAlert[]>();
const inMemoryAlertById = new Map<string, PriceAlert>();

// =============================================================================
// Alert Operations
// =============================================================================

/**
 * Generate unique alert ID
 */
// Import crypto for secure ID generation
import { randomUUID } from 'crypto';

function generateAlertId(): string {
  return `alert_${randomUUID()}`;
}

/**
 * Get all alerts for a user
 */
export async function getUserAlerts(
  userId: string,
  status?: AlertStatus
): Promise<PriceAlert[]> {
  try {
    const key = getAlertsKey(userId);
    const alerts = await kv.get<PriceAlert[]>(key) || [];
    
    if (status) {
      return alerts.filter(a => a.status === status);
    }
    
    return alerts;
  } catch (error) {
    console.warn('KV not available, using in-memory storage:', error);
    const cached = inMemoryAlerts.get(userId) || [];
    return status ? cached.filter(a => a.status === status) : cached;
  }
}

/**
 * Get alert by ID
 */
export async function getAlertById(alertId: string): Promise<PriceAlert | null> {
  try {
    const key = getAlertByIdKey(alertId);
    return await kv.get<PriceAlert>(key);
  } catch (error) {
    console.warn('KV not available, using in-memory storage:', error);
    return inMemoryAlertById.get(alertId) || null;
  }
}

/**
 * Create a new price alert
 */
export async function createAlert(
  params: Omit<PriceAlert, 'id' | 'status' | 'createdAt' | 'repeatCount'>
): Promise<PriceAlert> {
  const alert: PriceAlert = {
    ...params,
    id: generateAlertId(),
    status: 'active',
    createdAt: new Date().toISOString(),
    repeatCount: 0,
  };
  
  await saveAlert(alert);
  return alert;
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  alertId: string,
  status: AlertStatus,
  triggeredPrice?: number
): Promise<PriceAlert | null> {
  const alert = await getAlertById(alertId);
  if (!alert) return null;
  
  alert.status = status;
  if (status === 'triggered' && triggeredPrice) {
    alert.triggeredAt = new Date().toISOString();
    alert.triggeredPrice = triggeredPrice;
    alert.repeatCount += 1;
    
    // Reset to active if repeats remaining
    if (alert.maxRepeats > 0 && alert.repeatCount < alert.maxRepeats) {
      alert.status = 'active';
    }
  }
  
  await saveAlert(alert);
  return alert;
}

/**
 * Cancel an alert
 */
export async function cancelAlert(
  userId: string,
  alertId: string
): Promise<boolean> {
  const alert = await getAlertById(alertId);
  if (!alert || alert.userId !== userId) return false;
  
  alert.status = 'cancelled';
  await saveAlert(alert);
  return true;
}

/**
 * Delete an alert permanently
 */
export async function deleteAlert(
  userId: string,
  alertId: string
): Promise<boolean> {
  try {
    // Get user's alerts
    const alerts = await getUserAlerts(userId);
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    
    if (alertIndex === -1) return false;
    
    // Remove from list
    alerts.splice(alertIndex, 1);
    
    // Save updated list
    const key = getAlertsKey(userId);
    await kv.set(key, alerts);
    
    // Remove individual alert
    const alertKey = getAlertByIdKey(alertId);
    await kv.del(alertKey);
    
    return true;
  } catch (error) {
    console.warn('KV not available:', error);
    const alerts = inMemoryAlerts.get(userId) || [];
    const filtered = alerts.filter(a => a.id !== alertId);
    inMemoryAlerts.set(userId, filtered);
    inMemoryAlertById.delete(alertId);
    return true;
  }
}

/**
 * Check and trigger alerts for a coin
 */
export async function checkAlerts(
  coinId: string,
  currentPrice: number
): Promise<AlertTriggerResult[]> {
  const results: AlertTriggerResult[] = [];
  
  try {
    // Get all active alerts for this coin from index
    const indexKey = getActiveAlertsIndexKey();
    const activeAlertIds = await kv.get<string[]>(indexKey) || [];
    
    for (const alertId of activeAlertIds) {
      const alert = await getAlertById(alertId);
      if (!alert || alert.coinId !== coinId || alert.status !== 'active') continue;
      
      const result = evaluateAlert(alert, currentPrice);
      results.push(result);
      
      if (result.triggered) {
        await updateAlertStatus(alertId, 'triggered', currentPrice);
      }
    }
  } catch (error) {
    console.warn('Error checking alerts:', error);
  }
  
  return results;
}

/**
 * Evaluate if an alert should trigger
 */
function evaluateAlert(alert: PriceAlert, currentPrice: number): AlertTriggerResult {
  let triggered = false;
  let message = '';
  
  switch (alert.type) {
    case 'price_above':
      triggered = currentPrice >= alert.threshold;
      message = triggered
        ? `${alert.symbol} is now above $${alert.threshold} at $${currentPrice.toFixed(2)}`
        : `${alert.symbol} at $${currentPrice.toFixed(2)} (target: above $${alert.threshold})`;
      break;
      
    case 'price_below':
      triggered = currentPrice <= alert.threshold;
      message = triggered
        ? `${alert.symbol} is now below $${alert.threshold} at $${currentPrice.toFixed(2)}`
        : `${alert.symbol} at $${currentPrice.toFixed(2)} (target: below $${alert.threshold})`;
      break;
      
    case 'percent_change':
      const percentChange = ((currentPrice - alert.currentPriceAtCreation) / alert.currentPriceAtCreation) * 100;
      triggered = Math.abs(percentChange) >= Math.abs(alert.threshold);
      message = triggered
        ? `${alert.symbol} changed ${percentChange.toFixed(2)}% (threshold: ${alert.threshold}%)`
        : `${alert.symbol} changed ${percentChange.toFixed(2)}% (waiting for ${alert.threshold}%)`;
      break;
      
    case 'volume_spike':
      // Volume spike would need volume data - simplified for now
      message = 'Volume spike detection requires volume data';
      break;
  }
  
  return {
    alert,
    triggered,
    currentPrice,
    message,
  };
}

/**
 * Get alert statistics for a user
 */
export async function getAlertStats(userId: string): Promise<AlertStats> {
  const alerts = await getUserAlerts(userId);
  
  const stats: AlertStats = {
    totalAlerts: alerts.length,
    activeAlerts: alerts.filter(a => a.status === 'active').length,
    triggeredAlerts: alerts.filter(a => a.status === 'triggered').length,
    alertsByType: {
      price_above: 0,
      price_below: 0,
      percent_change: 0,
      volume_spike: 0,
    },
  };
  
  for (const alert of alerts) {
    stats.alertsByType[alert.type]++;
  }
  
  return stats;
}

/**
 * Get active alerts count for a coin
 */
export async function getActiveAlertsForCoin(
  userId: string,
  coinId: string
): Promise<PriceAlert[]> {
  const alerts = await getUserAlerts(userId, 'active');
  return alerts.filter(a => a.coinId === coinId);
}

// =============================================================================
// Helper Functions
// =============================================================================

async function saveAlert(alert: PriceAlert): Promise<void> {
  try {
    // Save individual alert
    const alertKey = getAlertByIdKey(alert.id);
    await kv.set(alertKey, alert);
    
    // Update user's alerts list
    const userKey = getAlertsKey(alert.userId);
    const userAlerts = await kv.get<PriceAlert[]>(userKey) || [];
    
    const existingIndex = userAlerts.findIndex(a => a.id === alert.id);
    if (existingIndex >= 0) {
      userAlerts[existingIndex] = alert;
    } else {
      userAlerts.push(alert);
    }
    
    await kv.set(userKey, userAlerts);
    
    // Update active alerts index
    if (alert.status === 'active') {
      const indexKey = getActiveAlertsIndexKey();
      const index = await kv.get<string[]>(indexKey) || [];
      if (!index.includes(alert.id)) {
        index.push(alert.id);
        await kv.set(indexKey, index);
      }
    }
  } catch (error) {
    console.warn('KV not available, using in-memory storage:', error);
    
    // In-memory fallback
    inMemoryAlertById.set(alert.id, alert);
    
    const userAlerts = inMemoryAlerts.get(alert.userId) || [];
    const existingIndex = userAlerts.findIndex(a => a.id === alert.id);
    if (existingIndex >= 0) {
      userAlerts[existingIndex] = alert;
    } else {
      userAlerts.push(alert);
    }
    inMemoryAlerts.set(alert.userId, userAlerts);
  }
}

/**
 * Get default user ID
 */
export function getDefaultUserId(): string {
  return 'default-user';
}
