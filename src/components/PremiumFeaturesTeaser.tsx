/**
 * Premium Features Teaser Component
 * Surfaces premium API features with upgrade CTAs
 * Shows: smart money, enhanced whale data, AI signals, etc.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  previewData?: unknown;
  price: string;
  apiEndpoint: string;
}

const premiumFeatures: PremiumFeature[] = [
  {
    id: 'smart-money',
    title: 'Smart Money Tracking',
    description: 'Track institutional wallet movements and copy-trade signals from top performers',
    icon: '🧠',
    price: '$0.05/call',
    apiEndpoint: '/api/premium/smart-money',
  },
  {
    id: 'ai-signals',
    title: 'AI Trading Signals',
    description: 'Machine learning-powered buy/sell signals with confidence scores',
    icon: '🎯',
    price: '$0.05/call',
    apiEndpoint: '/api/premium/ai/signals',
  },
  {
    id: 'whale-alerts',
    title: 'Enhanced Whale Alerts',
    description: 'Real-time whale transaction alerts with address labeling and historical context',
    icon: '🐋',
    price: '$0.05/call',
    apiEndpoint: '/api/premium/whales/alerts',
  },
  {
    id: 'portfolio-analytics',
    title: 'Portfolio Analytics',
    description: 'Advanced portfolio analysis with risk metrics, correlation, and optimization',
    icon: '📊',
    price: '$0.05/call',
    apiEndpoint: '/api/premium/portfolio/analytics',
  },
  {
    id: 'ai-compare',
    title: 'AI Coin Comparison',
    description: 'Deep AI analysis comparing two cryptocurrencies across multiple dimensions',
    icon: '⚖️',
    price: '$0.05/call',
    apiEndpoint: '/api/premium/ai/compare',
  },
  {
    id: 'screener-advanced',
    title: 'Advanced Screener',
    description: 'Professional-grade screening with 50+ technical and on-chain indicators',
    icon: '🔍',
    price: '$0.05/call',
    apiEndpoint: '/api/premium/screener/advanced',
  },
];

interface PremiumFeatureCardProps {
  feature: PremiumFeature;
  showPreview?: boolean;
  onUpgrade?: () => void;
}

function PremiumFeatureCard({ feature, showPreview = true }: PremiumFeatureCardProps) {
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    if (!showPreview || previewData) return;
    
    setLoading(true);
    try {
      // Try to get a preview (will return limited data for free users)
      const response = await fetch(`${feature.apiEndpoint}?preview=true`);
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.preview);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-all group"
      onMouseEnter={loadPreview}
    >
      {/* Premium badge */}
      <div className="absolute -top-2 -right-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
          ⭐ PRO
        </span>
      </div>

      <div className="flex items-start gap-4">
        <div className="text-3xl">{feature.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {feature.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {feature.description}
          </p>
          
          {/* Preview data placeholder */}
          {showPreview && (
            <div className="mb-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 relative overflow-hidden">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
                </div>
              ) : (
                <div className="space-y-1 blur-sm">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Sample data preview...
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    +24.5% 🚀
                  </div>
                </div>
              )}
              {/* Blur overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/40 to-transparent dark:from-gray-800/80 dark:via-gray-800/40 flex items-end justify-center pb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  🔒 Upgrade to unlock
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {feature.price}
            </span>
            <Link
              href="/pricing/upgrade"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm hover:shadow-md"
            >
              Upgrade
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PremiumFeaturesTeaserProps {
  features?: string[]; // Feature IDs to show, or all if not specified
  title?: string;
  className?: string;
  columns?: 1 | 2 | 3;
}

export function PremiumFeaturesTeaser({
  features: featureIds,
  title = 'Unlock Premium Features',
  className = '',
  columns = 2,
}: PremiumFeaturesTeaserProps) {
  const displayFeatures = featureIds
    ? premiumFeatures.filter(f => featureIds.includes(f.id))
    : premiumFeatures;

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>⭐</span>
          {title}
        </h2>
        <Link
          href="/pricing"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all plans →
        </Link>
      </div>

      <div className={`grid gap-4 ${gridCols[columns]}`}>
        {displayFeatures.map(feature => (
          <PremiumFeatureCard key={feature.id} feature={feature} />
        ))}
      </div>

      {/* CTA Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Pay with Crypto
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use USDC on Base network • Instant activation • No credit card needed
              </p>
            </div>
          </div>
          <Link
            href="/pricing/upgrade"
            className="whitespace-nowrap px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline premium teaser for embedding in free features
 */
interface InlinePremiumTeaserProps {
  feature: string;
  message?: string;
}

export function InlinePremiumTeaser({ feature, message }: InlinePremiumTeaserProps) {
  const featureData = premiumFeatures.find(f => f.id === feature);
  
  if (!featureData) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
      <span>{featureData.icon}</span>
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {message || `Unlock ${featureData.title} for deeper insights`}
      </span>
      <Link
        href="/pricing/upgrade"
        className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
      >
        Upgrade →
      </Link>
    </div>
  );
}
