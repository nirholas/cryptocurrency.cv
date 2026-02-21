'use client';

import { useState, useEffect, useCallback } from 'react';

interface Reactions {
  bullish: number;
  bearish: number;
  interesting: number;
  boring: number;
}

type ReactionType = keyof Reactions;

interface ArticleEngagementProps {
  articleId: string;
  articleTitle: string;
}

const reactionConfig: { key: ReactionType; emoji: string; label: string; color: string; activeColor: string }[] = [
  { key: 'bullish', emoji: '🚀', label: 'Bullish', color: 'hover:bg-green-50 dark:hover:bg-green-900/20', activeColor: 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-400' },
  { key: 'bearish', emoji: '📉', label: 'Bearish', color: 'hover:bg-red-50 dark:hover:bg-red-900/20', activeColor: 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-400' },
  { key: 'interesting', emoji: '🤔', label: 'Interesting', color: 'hover:bg-blue-50 dark:hover:bg-blue-900/20', activeColor: 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400' },
  { key: 'boring', emoji: '😴', label: 'Boring', color: 'hover:bg-gray-100 dark:hover:bg-slate-700', activeColor: 'bg-gray-200 dark:bg-slate-600 ring-2 ring-gray-400' },
];

export function ArticleEngagement({ articleId, articleTitle }: ArticleEngagementProps) {
  const [reactions, setReactions] = useState<Reactions>({ bullish: 0, bearish: 0, interesting: 0, boring: 0 });
  const [views, setViews] = useState(0);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [copied, setCopied] = useState(false);
  const [animating, setAnimating] = useState<ReactionType | null>(null);

  const storageKey = `article-reaction-${articleId}`;

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/views?articleId=${articleId}`);
      if (res.ok) {
        const data = await res.json();
        setViews(Number(data.views || 0));
        if (data.reactions) {
          setReactions({
            bullish: Number(data.reactions.bullish || 0),
            bearish: Number(data.reactions.bearish || 0),
            interesting: Number(data.reactions.interesting || 0),
            boring: Number(data.reactions.boring || 0),
          });
        }
      }
    } catch { /* silent */ }
  }, [articleId]);

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem(storageKey);
    if (saved) setMyReaction(saved as ReactionType);
  }, [fetchData, storageKey]);

  const handleReact = async (type: ReactionType) => {
    if (myReaction) return; // Already voted

    // Optimistic update
    setMyReaction(type);
    setAnimating(type);
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
    localStorage.setItem(storageKey, type);

    setTimeout(() => setAnimating(null), 300);

    try {
      await fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, reaction: type }),
      });
    } catch { /* Already optimistically updated */ }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  const handleShareX = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(articleTitle);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
  };

  const handleShareTelegram = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(articleTitle);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'width=550,height=420');
  };

  // Dominant reaction
  const total = reactions.bullish + reactions.bearish + reactions.interesting + reactions.boring;
  const dominant = total > 0
    ? reactionConfig.reduce((a, b) => reactions[a.key] >= reactions[b.key] ? a : b)
    : null;
  const dominantPct = dominant && total > 0 ? Math.round((reactions[dominant.key] / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
      {/* Dominant reaction summary */}
      {dominant && total > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-slate-400">Community thinks:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {dominant.emoji} {dominant.label} ({dominantPct}%)
          </span>
          <span className="text-gray-500 dark:text-slate-400">· {views.toLocaleString()} views</span>
        </div>
      )}

      {/* Reaction buttons */}
      <div className="flex flex-wrap gap-2">
        {reactionConfig.map(({ key, emoji, label, color, activeColor }) => (
          <button
            key={key}
            onClick={() => handleReact(key)}
            disabled={myReaction !== null}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
              myReaction === key
                ? activeColor
                : myReaction !== null
                ? 'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 cursor-default'
                : `border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 ${color} cursor-pointer active:scale-95`
            } ${animating === key ? 'scale-110' : ''}`}
          >
            <span className={animating === key ? 'animate-bounce' : ''}>{emoji}</span>
            <span>{label}</span>
            <span className="text-xs text-gray-500 dark:text-slate-400 ml-0.5">{reactions[key]}</span>
          </button>
        ))}
      </div>

      {/* Share row */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
        <span className="text-xs text-gray-500 dark:text-slate-400 mr-1">Share:</span>
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
        >
          {copied ? '✓ Copied' : '🔗 Link'}
        </button>
        <button
          onClick={handleShareX}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
        >
          𝕏 Post
        </button>
        <button
          onClick={handleShareTelegram}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
        >
          ✈️ Telegram
        </button>
      </div>
    </div>
  );
}
