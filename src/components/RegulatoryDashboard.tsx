'use client';

/**
 * Regulatory Intelligence Dashboard
 * 
 * Comprehensive dashboard for monitoring cryptocurrency regulatory developments:
 * - Global regulatory risk radar
 * - Jurisdiction risk map with stance indicators
 * - Agency activity timeline
 * - Compliance deadline tracker
 * - Real-time regulatory event feed
 * - Impact assessment indicators
 * 
 * @module components/RegulatoryDashboard
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface RegulatoryEvent {
  id: string;
  title: string;
  description: string;
  jurisdiction: string;
  agency: string;
  actionType: string;
  impactLevel: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  affectedSectors: string[];
  affectedAssets: string[];
  effectiveDate?: string;
  commentDeadline?: string;
  publishedAt: string;
  sourceUrl: string;
  entities: {
    companies: string[];
    people: string[];
    protocols: string[];
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
  isBreaking: boolean;
}

interface JurisdictionProfile {
  jurisdiction: string;
  name: string;
  flag: string;
  stance: 'restrictive' | 'cautious' | 'neutral' | 'progressive' | 'unclear';
  stanceScore: number;
  primaryAgencies: string[];
  majorRegulations: string[];
  recentActivity: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyDates: { date: string; description: string; type: string }[];
  lastUpdated: string;
}

interface ComplianceDeadline {
  id: string;
  title: string;
  description: string;
  jurisdiction: string;
  agency: string;
  deadline: string;
  affectedSectors: string[];
  impactLevel: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  requirements: string[];
  penalties?: string;
  sourceUrl: string;
  status: 'upcoming' | 'imminent' | 'passed';
  daysUntil: number;
}

interface RegulatoryIntelligenceSummary {
  globalRiskLevel: 'stable' | 'elevated' | 'high' | 'critical';
  activeEvents: number;
  upcomingDeadlines: number;
  recentEnforcements: number;
  trendingTopics: { topic: string; mentions: number; sentiment: string }[];
  hotJurisdictions: string[];
  recentEvents: RegulatoryEvent[];
  criticalDeadlines: ComplianceDeadline[];
  marketImpact: {
    shortTerm: 'bullish' | 'bearish' | 'neutral';
    longTerm: 'bullish' | 'bearish' | 'neutral';
    reasoning: string;
  };
  generatedAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const JURISDICTION_FLAGS: Record<string, string> = {
  us: '🇺🇸', eu: '🇪🇺', uk: '🇬🇧', cn: '🇨🇳', jp: '🇯🇵', sg: '🇸🇬',
  ae: '🇦🇪', kr: '🇰🇷', au: '🇦🇺', br: '🇧🇷', ch: '🇨🇭', hk: '🇭🇰',
  ca: '🇨🇦', in: '🇮🇳', global: '🌍',
};

const IMPACT_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  informational: 'bg-gray-500',
};

const IMPACT_TEXT_COLORS: Record<string, string> = {
  critical: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-blue-600 dark:text-blue-400',
  informational: 'text-gray-600 dark:text-gray-400',
};

const STANCE_COLORS: Record<string, string> = {
  restrictive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  cautious: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  progressive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  unclear: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

const ACTION_TYPE_ICONS: Record<string, string> = {
  enforcement: '⚖️',
  'rule-proposal': '📝',
  'rule-final': '📜',
  guidance: '📋',
  investigation: '🔍',
  settlement: '🤝',
  licensing: '🏛️',
  ban: '🚫',
  warning: '⚠️',
  consultation: '💬',
  framework: '🏗️',
  'compliance-deadline': '⏰',
};

// ============================================================================
// HOOKS
// ============================================================================

function useRegulatoryData() {
  const [summary, setSummary] = useState<RegulatoryIntelligenceSummary | null>(null);
  const [jurisdictions, setJurisdictions] = useState<JurisdictionProfile[]>([]);
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [events, setEvents] = useState<RegulatoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [summaryRes, jurisdictionsRes, deadlinesRes, eventsRes] = await Promise.all([
        fetch('/api/regulatory?action=summary'),
        fetch('/api/regulatory?action=jurisdictions'),
        fetch('/api/regulatory?action=deadlines'),
        fetch('/api/regulatory?action=events&limit=50'),
      ]);

      const [summaryData, jurisdictionsData, deadlinesData, eventsData] = await Promise.all([
        summaryRes.json(),
        jurisdictionsRes.json(),
        deadlinesRes.json(),
        eventsRes.json(),
      ]);

      if (summaryData.success) setSummary(summaryData.data);
      if (jurisdictionsData.success) setJurisdictions(jurisdictionsData.data.jurisdictions || []);
      if (deadlinesData.success) setDeadlines(deadlinesData.data.deadlines || []);
      if (eventsData.success) setEvents(eventsData.data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch regulatory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { summary, jurisdictions, deadlines, events, loading, error, refresh: fetchData };
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Risk Level Badge
 */
function RiskLevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    stable: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    elevated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 animate-pulse',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level] || colors.medium}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

/**
 * Impact Badge
 */
function ImpactBadge({ impact }: { impact: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${IMPACT_COLORS[impact] || IMPACT_COLORS.medium}`}>
      {impact.toUpperCase()}
    </span>
  );
}

/**
 * Sentiment Indicator
 */
function SentimentIndicator({ sentiment }: { sentiment: string }) {
  const icons: Record<string, string> = {
    positive: '📈',
    negative: '📉',
    neutral: '➡️',
  };

  const colors: Record<string, string> = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <span className={`flex items-center gap-1 ${colors[sentiment] || colors.neutral}`}>
      <span>{icons[sentiment] || '➡️'}</span>
      <span className="text-xs">{sentiment}</span>
    </span>
  );
}

/**
 * Global Risk Radar
 */
function GlobalRiskRadar({ summary }: { summary: RegulatoryIntelligenceSummary | null }) {
  if (!summary) return null;

  const riskLevelValue: Record<string, number> = {
    stable: 25,
    elevated: 50,
    high: 75,
    critical: 95,
  };

  const riskValue = riskLevelValue[summary.globalRiskLevel] || 50;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🌐 Global Regulatory Risk</h3>
        <RiskLevelBadge level={summary.globalRiskLevel} />
      </div>

      {/* Risk Gauge */}
      <div className="relative h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
        <div 
          className={`absolute left-0 top-0 h-full transition-all duration-500 ${
            riskValue >= 75 ? 'bg-red-500' : 
            riskValue >= 50 ? 'bg-orange-500' : 
            riskValue >= 25 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${riskValue}%` }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.activeEvents}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Active Events</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.upcomingDeadlines}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Deadlines</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.recentEnforcements}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Enforcements</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.hotJurisdictions.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Hot Regions</div>
        </div>
      </div>

      {/* Market Impact */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Market Impact:</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">Short: <span className={summary.marketImpact.shortTerm === 'bullish' ? 'text-green-500' : summary.marketImpact.shortTerm === 'bearish' ? 'text-red-500' : 'text-gray-500'}>{summary.marketImpact.shortTerm}</span></span>
            <span className="text-xs text-gray-500">Long: <span className={summary.marketImpact.longTerm === 'bullish' ? 'text-green-500' : summary.marketImpact.longTerm === 'bearish' ? 'text-red-500' : 'text-gray-500'}>{summary.marketImpact.longTerm}</span></span>
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">{summary.marketImpact.reasoning}</p>
      </div>
    </div>
  );
}

/**
 * Jurisdiction Risk Map
 */
function JurisdictionRiskMap({ jurisdictions }: { jurisdictions: JurisdictionProfile[] }) {
  const sortedJurisdictions = useMemo(() => {
    return [...jurisdictions].sort((a, b) => {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (riskOrder[a.riskLevel as keyof typeof riskOrder] || 2) - 
             (riskOrder[b.riskLevel as keyof typeof riskOrder] || 2);
    });
  }, [jurisdictions]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🗺️ Jurisdiction Risk Map</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedJurisdictions.slice(0, 12).map((jurisdiction) => (
          <div 
            key={jurisdiction.jurisdiction}
            className="p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-500 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{jurisdiction.flag}</span>
              <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{jurisdiction.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded ${STANCE_COLORS[jurisdiction.stance] || STANCE_COLORS.neutral}`}>
                {jurisdiction.stance}
              </span>
              <RiskLevelBadge level={jurisdiction.riskLevel} />
            </div>
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500"
                  style={{ width: `${jurisdiction.recentActivity}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Activity: {jurisdiction.recentActivity}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compliance Deadlines Timeline
 */
function DeadlinesTimeline({ deadlines }: { deadlines: ComplianceDeadline[] }) {
  const sortedDeadlines = useMemo(() => {
    return [...deadlines].sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 8);
  }, [deadlines]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⏰ Compliance Deadlines</h3>
      
      <div className="space-y-4">
        {sortedDeadlines.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming deadlines</p>
        ) : (
          sortedDeadlines.map((deadline) => (
            <div 
              key={deadline.id}
              className={`relative pl-4 border-l-2 ${
                deadline.status === 'imminent' ? 'border-red-500' :
                deadline.status === 'passed' ? 'border-gray-300' :
                'border-yellow-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{JURISDICTION_FLAGS[deadline.jurisdiction] || '🌍'}</span>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">{deadline.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{deadline.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ImpactBadge impact={deadline.impactLevel} />
                    <span className={`text-xs font-medium ${
                      deadline.daysUntil <= 30 ? 'text-red-600 dark:text-red-400' :
                      deadline.daysUntil <= 90 ? 'text-orange-600 dark:text-orange-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {deadline.daysUntil <= 0 ? 'Passed' :
                       deadline.daysUntil === 1 ? 'Tomorrow' :
                       `${deadline.daysUntil} days`}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(deadline.deadline).toLocaleDateString()}
                  </div>
                  {deadline.penalties && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      ⚠️ Penalties apply
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Regulatory Event Card
 */
function EventCard({ event }: { event: RegulatoryEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className={`p-4 rounded-lg border ${
        event.isBreaking 
          ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
      } cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">
          {ACTION_TYPE_ICONS[event.actionType] || '📰'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {event.isBreaking && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded animate-pulse">
                BREAKING
              </span>
            )}
            <span className="text-lg">{JURISDICTION_FLAGS[event.jurisdiction] || '🌍'}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{event.agency}</span>
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">{event.title}</h4>
          {expanded && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{event.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <ImpactBadge impact={event.impactLevel} />
            <SentimentIndicator sentiment={event.sentiment} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(event.publishedAt).toLocaleDateString()}
            </span>
          </div>
          {expanded && event.affectedAssets.length > 0 && (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400">Affected:</span>
              {event.affectedAssets.map((asset) => (
                <span key={asset} className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-xs rounded">
                  {asset}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Event Feed
 */
function EventFeed({ events }: { events: RegulatoryEvent[] }) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'enforcement'>('all');

  const filteredEvents = useMemo(() => {
    switch (filter) {
      case 'critical':
        return events.filter(e => e.impactLevel === 'critical' || e.impactLevel === 'high');
      case 'enforcement':
        return events.filter(e => e.actionType === 'enforcement' || e.actionType === 'settlement');
      default:
        return events;
    }
  }, [events, filter]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📰 Regulatory Events</h3>
        <div className="flex items-center gap-2">
          {(['all', 'critical', 'enforcement'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No events found</p>
        ) : (
          filteredEvents.slice(0, 20).map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Trending Topics
 */
function TrendingTopics({ topics }: { topics: { topic: string; mentions: number; sentiment: string }[] }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔥 Trending Topics</h3>
      
      <div className="space-y-2">
        {topics.slice(0, 8).map((topic, index) => (
          <div key={topic.topic} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-4">{index + 1}</span>
              <span className="text-sm text-gray-900 dark:text-white">{topic.topic}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{topic.mentions} mentions</span>
              <span className={`w-2 h-2 rounded-full ${
                topic.sentiment === 'positive' ? 'bg-green-500' :
                topic.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 h-48 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-lg" />
      </div>
      <div className="h-96 bg-gray-200 dark:bg-slate-700 rounded-lg" />
    </div>
  );
}

/**
 * Error Display
 */
function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
      <span className="text-3xl">⚠️</span>
      <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mt-2">Failed to Load Data</h3>
      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface RegulatoryDashboardProps {
  /** Initial jurisdiction filter */
  initialJurisdiction?: string;
  /** Compact mode for embedding */
  compact?: boolean;
}

/**
 * Regulatory Intelligence Dashboard
 * 
 * Comprehensive dashboard for monitoring cryptocurrency regulatory developments
 */
export function RegulatoryDashboard({ 
  initialJurisdiction,
  compact = false,
}: RegulatoryDashboardProps) {
  const { summary, jurisdictions, deadlines, events, loading, error, refresh } = useRegulatoryData();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refresh} />;
  }

  if (compact) {
    return (
      <div className="space-y-4">
        <GlobalRiskRadar summary={summary} />
        <DeadlinesTimeline deadlines={deadlines.slice(0, 5)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Regulatory Intelligence</h2>
          <p className="text-gray-600 dark:text-gray-400">Real-time monitoring of global crypto regulations</p>
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Top Row: Risk Radar and Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlobalRiskRadar summary={summary} />
        </div>
        <div>
          <TrendingTopics topics={summary?.trendingTopics || []} />
        </div>
      </div>

      {/* Middle Row: Jurisdictions and Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JurisdictionRiskMap jurisdictions={jurisdictions} />
        <DeadlinesTimeline deadlines={deadlines} />
      </div>

      {/* Bottom: Events Feed */}
      <EventFeed events={events} />

      {/* Last Updated */}
      {summary && (
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          Last updated: {new Date(summary.generatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default RegulatoryDashboard;
