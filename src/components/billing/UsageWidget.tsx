'use client';

/**
 * Usage Widget
 * 
 * A compact widget showing current API usage that can be
 * embedded in the header, dashboard, or sidebar.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowUpRightIcon,
} from '@heroicons/react/24/outline';
import { useApiKeyStandalone } from '@/hooks/useApiKey';

interface UsageWidgetProps {
  variant?: 'compact' | 'detailed';
  className?: string;
}

interface UsageData {
  current: number;
  limit: number;
  percentage: number;
  tier: string;
  daysRemaining: number;
}

export default function UsageWidget({ variant = 'compact', className = '' }: UsageWidgetProps) {
  const { apiKey } = useApiKeyStandalone();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      // Skip if no API key is stored
      if (!apiKey) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/billing/usage', {
          headers: {
            'X-API-Key': apiKey,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsage({
            current: data.summary.totalRequests,
            limit: data.summary.limit,
            percentage: data.summary.usagePercentage,
            tier: data.tier || 'pro',
            daysRemaining: data.period?.daysRemaining || 15,
          });
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'amber';
    return 'blue';
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-24" />
      </div>
    );
  }

  // No fallback - show empty state if no data
  if (!usage) {
    if (variant === 'compact') {
      return (
        <Link
          href="/billing"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${className}`}
        >
          <ChartBarIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">No data</span>
        </Link>
      );
    }
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <ChartBarIcon className="w-5 h-5" />
          <span className="text-sm">Sign in to view usage</span>
        </div>
      </div>
    );
  }

  const displayUsage = usage;

  const statusColor = getStatusColor(displayUsage.percentage);

  if (variant === 'compact') {
    return (
      <Link
        href="/billing"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${className}`}
      >
        <ChartBarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatNumber(displayUsage.current)}
          </span>
          <span className="text-xs text-gray-400">/</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatNumber(displayUsage.limit)}
          </span>
        </div>
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-600 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-${statusColor}-500`}
            style={{ width: `${Math.min(displayUsage.percentage, 100)}%` }}
          />
        </div>
        {displayUsage.percentage >= 90 && (
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
        )}
      </Link>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ChartBarIcon className={`w-5 h-5 text-${statusColor}-500`} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            API Usage
          </span>
        </div>
        <Link
          href="/billing"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View Details
          <ArrowUpRightIcon className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatNumber(displayUsage.current)}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          / {formatNumber(displayUsage.limit)} requests
        </span>
      </div>

      <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all bg-${statusColor}-500`}
          style={{ width: `${Math.min(displayUsage.percentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{displayUsage.percentage}% used</span>
        <span>{displayUsage.daysRemaining} days left</span>
      </div>

      {displayUsage.percentage >= 75 && (
        <div className={`mt-3 p-2 rounded-lg ${
          displayUsage.percentage >= 90
            ? 'bg-red-50 dark:bg-red-900/20'
            : 'bg-gray-50 dark:bg-gray-800/20'
        }`}>
          <p className={`text-xs ${
            displayUsage.percentage >= 90
              ? 'text-red-700 dark:text-red-400'
              : 'text-gray-700 dark:text-gray-400'
          }`}>
            {displayUsage.percentage >= 90
              ? '⚠️ You\'re approaching your limit. Consider upgrading.'
              : '💡 You\'ve used 75% of your monthly limit.'}
          </p>
        </div>
      )}
    </div>
  );
}
