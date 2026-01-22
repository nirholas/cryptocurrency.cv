'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Bell, 
  BellOff, 
  Trash2, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Percent,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAlerts, PriceAlert } from './AlertsProvider';
import { useToast } from '@/components/Toast';

interface AlertsListProps {
  coinId?: string; // If provided, filter by coin
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

export function AlertsList({ 
  coinId, 
  maxItems,
  showHeader = true,
  className = '' 
}: AlertsListProps) {
  const { 
    alerts, 
    removeAlert, 
    toggleAlert, 
    clearTriggeredAlerts, 
    clearAllAlerts,
    isLoaded 
  } = useAlerts();
  const { addToast } = useToast();

  // Filter alerts
  let filteredAlerts = coinId 
    ? alerts.filter(a => a.coinId === coinId)
    : alerts;
  
  if (maxItems) {
    filteredAlerts = filteredAlerts.slice(0, maxItems);
  }

  const activeAlerts = filteredAlerts.filter(a => !a.triggered);
  const triggeredAlerts = filteredAlerts.filter(a => a.triggered);

  if (!isLoaded) {
    return (
      <div className={`animate-pulse space-y-3 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (filteredAlerts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 mb-1">No alerts set</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Create alerts to get notified when prices change
        </p>
      </div>
    );
  }

  const handleRemove = (id: string, coinSymbol: string) => {
    removeAlert(id);
    addToast({
      type: 'info',
      title: 'Alert removed',
      message: `${coinSymbol.toUpperCase()} alert deleted`,
      duration: 3000,
    });
  };

  const handleReactivate = (id: string) => {
    toggleAlert(id);
    addToast({
      type: 'success',
      title: 'Alert reactivated',
      duration: 3000,
    });
  };

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Price Alerts
            </h3>
            {activeAlerts.length > 0 && (
              <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {activeAlerts.length} active
              </span>
            )}
          </div>
          {alerts.length > 0 && !coinId && (
            <button
              onClick={() => {
                if (confirm('Clear all alerts?')) {
                  clearAllAlerts();
                  addToast({ type: 'success', title: 'All alerts cleared' });
                }
              }}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Active
          </h4>
          {activeAlerts.map(alert => (
            <AlertItem 
              key={alert.id} 
              alert={alert} 
              onRemove={() => handleRemove(alert.id, alert.coinSymbol)}
            />
          ))}
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Triggered
            </h4>
            <button
              onClick={() => {
                clearTriggeredAlerts();
                addToast({ type: 'success', title: 'Triggered alerts cleared' });
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear all
            </button>
          </div>
          {triggeredAlerts.map(alert => (
            <AlertItem 
              key={alert.id} 
              alert={alert} 
              onRemove={() => handleRemove(alert.id, alert.coinSymbol)}
              onReactivate={() => handleReactivate(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AlertItemProps {
  alert: PriceAlert;
  onRemove: () => void;
  onReactivate?: () => void;
}

function AlertItem({ alert, onRemove, onReactivate }: AlertItemProps) {
  const ConditionIcon = getConditionIcon(alert.condition);
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        alert.triggered
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className={`p-2 rounded-lg ${
        alert.triggered
          ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
          : getConditionColor(alert.condition)
      }`}>
        {alert.triggered ? (
          <Check className="w-4 h-4" />
        ) : (
          <ConditionIcon className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link 
            href={`/coin/${alert.coinId}`}
            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          >
            {alert.coinSymbol.toUpperCase()}
          </Link>
          {alert.repeat && (
            <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded">
              Repeat
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {getAlertDescription(alert)}
        </p>
        {alert.triggered && alert.triggeredAt && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Triggered {formatRelativeTime(alert.triggeredAt)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        {alert.triggered && onReactivate && (
          <button
            onClick={onReactivate}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="Reactivate alert"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Remove alert"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function getConditionIcon(condition: PriceAlert['condition']) {
  switch (condition) {
    case 'above':
    case 'percent_up':
      return TrendingUp;
    case 'below':
    case 'percent_down':
      return TrendingDown;
    default:
      return Bell;
  }
}

function getConditionColor(condition: PriceAlert['condition']) {
  switch (condition) {
    case 'above':
    case 'percent_up':
      return 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400';
    case 'below':
    case 'percent_down':
      return 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  }
}

function getAlertDescription(alert: PriceAlert): string {
  const isPercent = alert.condition === 'percent_up' || alert.condition === 'percent_down';
  
  if (isPercent) {
    return alert.condition === 'percent_up'
      ? `Price increases by ${alert.targetPercent}%`
      : `Price decreases by ${alert.targetPercent}%`;
  }
  
  const priceStr = `$${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  return alert.condition === 'above'
    ? `Price goes above ${priceStr}`
    : `Price goes below ${priceStr}`;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default AlertsList;
