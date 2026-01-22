'use client';

import React from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useAlerts } from './AlertsProvider';

interface PriceAlertButtonProps {
  coinId: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function PriceAlertButton({ 
  coinId, 
  onClick,
  size = 'md',
  showCount = true,
  className = '' 
}: PriceAlertButtonProps) {
  const { getAlertsForCoin, isLoaded } = useAlerts();
  
  const alerts = getAlertsForCoin(coinId);
  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);
  const hasTriggered = triggeredAlerts.length > 0;
  
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (!isLoaded) {
    return (
      <button
        disabled
        className={`${sizeClasses[size]} rounded-lg text-gray-300 dark:text-gray-600 ${className}`}
        aria-label="Loading alerts"
      >
        <Bell className={`${iconSizes[size]} animate-pulse`} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]} 
        rounded-lg
        relative
        transition-all duration-200
        ${activeAlerts.length > 0 || hasTriggered
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20' 
          : 'text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
        ${hasTriggered ? 'animate-pulse' : ''}
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        ${className}
      `}
      aria-label={activeAlerts.length > 0 ? `${activeAlerts.length} active alerts` : 'Set price alert'}
      title={activeAlerts.length > 0 ? `${activeAlerts.length} active alerts` : 'Set price alert'}
    >
      {hasTriggered ? (
        <BellRing className={`${iconSizes[size]}`} />
      ) : (
        <Bell className={`${iconSizes[size]} ${activeAlerts.length > 0 ? 'fill-current' : ''}`} />
      )}
      
      {showCount && activeAlerts.length > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
          {activeAlerts.length}
        </span>
      )}
      
      {showCount && hasTriggered && activeAlerts.length === 0 && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </button>
  );
}

export default PriceAlertButton;
