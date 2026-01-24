/**
 * Market Anomaly Alerts Banner
 * Surfaces unusual market activity using /api/analytics/anomalies
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Anomaly {
  id: string;
  type: 'volume_spike' | 'price_spike' | 'unusual_activity' | 'whale_movement' | 'sentiment_shift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  coin?: string;
  symbol?: string;
  message: string;
  value?: number;
  expectedValue?: number;
  detectedAt: string;
  url?: string;
}

const severityConfig = {
  low: { 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
    icon: 'ℹ️'
  },
  medium: { 
    bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: '⚠️'
  },
  high: { 
    bg: 'bg-orange-50 dark:bg-orange-900/20', 
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-300',
    icon: '🔥'
  },
  critical: { 
    bg: 'bg-red-50 dark:bg-red-900/20', 
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    icon: '🚨'
  },
};

const typeConfig = {
  volume_spike: { label: 'Volume Spike', icon: '📊' },
  price_spike: { label: 'Price Movement', icon: '📈' },
  unusual_activity: { label: 'Unusual Activity', icon: '👀' },
  whale_movement: { label: 'Whale Alert', icon: '🐋' },
  sentiment_shift: { label: 'Sentiment Shift', icon: '🎭' },
};

interface AnomalyAlertsBannerProps {
  maxAlerts?: number;
  showDismiss?: boolean;
  className?: string;
}

export function AnomalyAlertsBanner({ 
  maxAlerts = 3,
  showDismiss = true,
  className = ''
}: AnomalyAlertsBannerProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const response = await fetch('/api/analytics/anomalies');
        if (response.ok) {
          const data = await response.json();
          setAnomalies(data.anomalies || []);
        }
      } catch (error) {
        console.error('Failed to fetch anomalies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnomalies();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnomalies, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleAnomalies = anomalies
    .filter(a => !dismissed.has(a.id))
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

  const displayedAnomalies = expanded 
    ? visibleAnomalies 
    : visibleAnomalies.slice(0, maxAlerts);

  const dismissAlert = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const dismissAll = () => {
    setDismissed(new Set(anomalies.map(a => a.id)));
  };

  if (loading) {
    return (
      <div className={`animate-pulse h-12 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`} />
    );
  }

  if (visibleAnomalies.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span>🔔</span>
          Market Alerts
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 dark:bg-gray-700">
            {visibleAnomalies.length}
          </span>
        </h3>
        {showDismiss && visibleAnomalies.length > 0 && (
          <button
            onClick={dismissAll}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Dismiss all
          </button>
        )}
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {displayedAnomalies.map((anomaly) => {
          const severity = severityConfig[anomaly.severity];
          const type = typeConfig[anomaly.type] || typeConfig.unusual_activity;

          return (
            <div
              key={anomaly.id}
              className={`relative flex items-start gap-3 p-3 rounded-lg border ${severity.bg} ${severity.border} ${severity.text}`}
            >
              <span className="text-lg flex-shrink-0">{severity.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/50 dark:bg-black/20">
                    {type.icon} {type.label}
                  </span>
                  {anomaly.symbol && (
                    <Link 
                      href={`/coin/${anomaly.coin || anomaly.symbol.toLowerCase()}`}
                      className="text-xs font-bold hover:underline"
                    >
                      ${anomaly.symbol}
                    </Link>
                  )}
                </div>
                <p className="text-sm">{anomaly.message}</p>
                {anomaly.value !== undefined && anomaly.expectedValue !== undefined && (
                  <p className="text-xs mt-1 opacity-75">
                    Current: {anomaly.value.toLocaleString()} vs Expected: {anomaly.expectedValue.toLocaleString()}
                  </p>
                )}
              </div>
              {showDismiss && (
                <button
                  onClick={() => dismissAlert(anomaly.id)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                  aria-label="Dismiss alert"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse */}
      {visibleAnomalies.length > maxAlerts && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2"
        >
          {expanded 
            ? 'Show less' 
            : `Show ${visibleAnomalies.length - maxAlerts} more alerts`
          }
        </button>
      )}
    </div>
  );
}

/**
 * Compact inline alert for use in headers/navbars
 */
export function AnomalyAlertIndicator() {
  const [count, setCount] = useState(0);
  const [highestSeverity, setHighestSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/analytics/anomalies?count=true');
        if (response.ok) {
          const data = await response.json();
          setCount(data.count || 0);
          setHighestSeverity(data.highestSeverity || 'low');
        }
      } catch {
        // Silently fail
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  const severity = severityConfig[highestSeverity];

  return (
    <Link
      href="/analytics"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${severity.bg} ${severity.text} ${severity.border} border animate-pulse`}
      title={`${count} market anomalies detected`}
    >
      {severity.icon}
      <span>{count}</span>
    </Link>
  );
}
