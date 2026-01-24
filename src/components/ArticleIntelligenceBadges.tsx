/**
 * Article Intelligence Badges
 * Displays AI-detected attributes: clickbait score, AI-written detection, event classification
 * Surfaces underutilized APIs: /api/clickbait, /api/detect/ai-content, /api/classify
 */

'use client';

import { useState, useEffect } from 'react';
import { Tooltip } from './Tooltip';

interface ArticleIntelligenceProps {
  articleId: string;
  title: string;
  content?: string;
  showClickbait?: boolean;
  showAiContent?: boolean;
  showEventType?: boolean;
  compact?: boolean;
}

interface ClickbaitResult {
  score: number;
  isClickbait: boolean;
  reasons?: string[];
}

interface AiContentResult {
  isAiGenerated: boolean;
  confidence: number;
  indicators?: string[];
}

interface ClassifyResult {
  eventType: string;
  confidence: number;
  subType?: string;
}

const eventTypeConfig: Record<string, { emoji: string; label: string; color: string }> = {
  funding: { emoji: '💰', label: 'Funding', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  hack: { emoji: '🔓', label: 'Security', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  regulation: { emoji: '⚖️', label: 'Regulation', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  partnership: { emoji: '🤝', label: 'Partnership', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  launch: { emoji: '🚀', label: 'Launch', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  acquisition: { emoji: '🏢', label: 'M&A', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  listing: { emoji: '📈', label: 'Listing', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  airdrop: { emoji: '🎁', label: 'Airdrop', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
  analysis: { emoji: '📊', label: 'Analysis', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400' },
  opinion: { emoji: '💭', label: 'Opinion', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  technical: { emoji: '🔧', label: 'Technical', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  market: { emoji: '📉', label: 'Market', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  legal: { emoji: '⚖️', label: 'Legal', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
};

export function ArticleIntelligenceBadges({
  articleId,
  title,
  content,
  showClickbait = true,
  showAiContent = true,
  showEventType = true,
  compact = false,
}: ArticleIntelligenceProps) {
  const [clickbait, setClickbait] = useState<ClickbaitResult | null>(null);
  const [aiContent, setAiContent] = useState<AiContentResult | null>(null);
  const [eventType, setEventType] = useState<ClassifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntelligence = async () => {
      setLoading(true);
      
      try {
        // Fetch all intelligence data in parallel
        const promises = [];
        
        if (showClickbait) {
          promises.push(
            fetch(`/api/clickbait?title=${encodeURIComponent(title)}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          );
        } else {
          promises.push(Promise.resolve(null));
        }
        
        if (showAiContent && content) {
          promises.push(
            fetch('/api/detect/ai-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: content.slice(0, 2000) }),
            })
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          );
        } else {
          promises.push(Promise.resolve(null));
        }
        
        if (showEventType) {
          promises.push(
            fetch(`/api/classify?title=${encodeURIComponent(title)}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          );
        } else {
          promises.push(Promise.resolve(null));
        }
        
        const [clickbaitRes, aiContentRes, classifyRes] = await Promise.all(promises);
        
        setClickbait(clickbaitRes);
        setAiContent(aiContentRes);
        setEventType(classifyRes);
      } catch (error) {
        console.error('Failed to fetch article intelligence:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntelligence();
  }, [articleId, title, content, showClickbait, showAiContent, showEventType]);

  if (loading) {
    return (
      <div className="flex gap-1">
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  const badges = [];

  // Clickbait warning badge
  if (clickbait?.isClickbait && clickbait.score > 0.7) {
    badges.push(
      <Tooltip 
        key="clickbait" 
        content={`Clickbait score: ${Math.round(clickbait.score * 100)}%. ${clickbait.reasons?.join(', ') || 'Sensationalized headline detected'}`}
      >
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 cursor-help">
          ⚠️ {compact ? '' : 'Clickbait'}
        </span>
      </Tooltip>
    );
  }

  // AI-written indicator
  if (aiContent?.isAiGenerated && aiContent.confidence > 0.7) {
    badges.push(
      <Tooltip 
        key="ai-content" 
        content={`${Math.round(aiContent.confidence * 100)}% likely AI-generated. ${aiContent.indicators?.join(', ') || ''}`}
      >
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 cursor-help">
          🤖 {compact ? '' : 'AI-Written'}
        </span>
      </Tooltip>
    );
  }

  // Event type classification
  if (eventType?.eventType && eventType.confidence > 0.6) {
    const config = eventTypeConfig[eventType.eventType.toLowerCase()] || eventTypeConfig.analysis;
    badges.push(
      <Tooltip 
        key="event-type" 
        content={`Event classification: ${eventType.eventType}${eventType.subType ? ` (${eventType.subType})` : ''} - ${Math.round(eventType.confidence * 100)}% confidence`}
      >
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} cursor-help`}>
          {config.emoji} {compact ? '' : config.label}
        </span>
      </Tooltip>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges}
    </div>
  );
}

/**
 * Simple badge variant for article cards (no API calls - uses cached data)
 */
interface CachedBadgesProps {
  isClickbait?: boolean;
  clickbaitScore?: number;
  isAiGenerated?: boolean;
  eventType?: string;
  compact?: boolean;
}

export function ArticleBadges({
  isClickbait,
  clickbaitScore,
  isAiGenerated,
  eventType,
  compact = true,
}: CachedBadgesProps) {
  const badges = [];

  if (isClickbait && (clickbaitScore ?? 0) > 0.7) {
    badges.push(
      <span 
        key="clickbait"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        title={`Clickbait score: ${Math.round((clickbaitScore ?? 0) * 100)}%`}
      >
        ⚠️ {compact ? '' : 'Clickbait'}
      </span>
    );
  }

  if (isAiGenerated) {
    badges.push(
      <span 
        key="ai-content"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        title="AI-generated content detected"
      >
        🤖 {compact ? '' : 'AI'}
      </span>
    );
  }

  if (eventType) {
    const config = eventTypeConfig[eventType.toLowerCase()] || eventTypeConfig.analysis;
    badges.push(
      <span 
        key="event-type"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
        title={`Event type: ${eventType}`}
      >
        {config.emoji} {compact ? '' : config.label}
      </span>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {badges}
    </div>
  );
}
