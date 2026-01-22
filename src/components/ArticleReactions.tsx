/**
 * @fileoverview Article Reactions Component
 * 
 * Allows users to react to articles with emoji reactions.
 * Reactions are stored in localStorage for persistence.
 * 
 * @module components/ArticleReactions
 * 
 * @example
 * <ArticleReactions articleId="abc123" />
 * 
 * @features
 * - 5 reaction types: 👍 👎 🔥 😮 🤔
 * - LocalStorage persistence
 * - Animated reaction selection
 * - Shows total reaction counts
 * - One reaction per article per user
 */
'use client';

import { useState, useEffect } from 'react';

interface Reaction {
  emoji: string;
  label: string;
  count: number;
}

interface ArticleReactionsProps {
  articleId: string;
  className?: string;
}

const REACTIONS: { emoji: string; label: string }[] = [
  { emoji: '👍', label: 'Like' },
  { emoji: '👎', label: 'Dislike' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '🤔', label: 'Thinking' },
];

const STORAGE_KEY = 'crypto-news-reactions';

interface StoredReactions {
  [articleId: string]: {
    userReaction: string | null;
    counts: { [emoji: string]: number };
  };
}

export default function ArticleReactions({ articleId, className = '' }: ArticleReactionsProps) {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ [emoji: string]: number }>({});
  const [isAnimating, setIsAnimating] = useState<string | null>(null);

  // Load reactions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredReactions = JSON.parse(stored);
        if (data[articleId]) {
          setUserReaction(data[articleId].userReaction);
          setCounts(data[articleId].counts || {});
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [articleId]);

  const handleReaction = (emoji: string) => {
    setIsAnimating(emoji);
    setTimeout(() => setIsAnimating(null), 300);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data: StoredReactions = stored ? JSON.parse(stored) : {};
      
      if (!data[articleId]) {
        data[articleId] = { userReaction: null, counts: {} };
      }

      const prevReaction = data[articleId].userReaction;
      const newCounts = { ...data[articleId].counts };

      // Remove previous reaction if exists
      if (prevReaction) {
        newCounts[prevReaction] = Math.max(0, (newCounts[prevReaction] || 1) - 1);
      }

      // Toggle reaction
      if (prevReaction === emoji) {
        // Un-react
        data[articleId].userReaction = null;
        setUserReaction(null);
      } else {
        // Add new reaction
        newCounts[emoji] = (newCounts[emoji] || 0) + 1;
        data[articleId].userReaction = emoji;
        setUserReaction(emoji);
      }

      data[articleId].counts = newCounts;
      setCounts(newCounts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore localStorage errors
    }
  };

  const totalReactions = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {REACTIONS.map(({ emoji, label }) => {
          const isSelected = userReaction === emoji;
          const count = counts[emoji] || 0;
          const isCurrentlyAnimating = isAnimating === emoji;

          return (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={`
                relative flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm
                transition-all duration-200 
                ${isSelected 
                  ? 'bg-brand-100 dark:bg-brand-900/40 ring-2 ring-brand-500' 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                ${isCurrentlyAnimating ? 'scale-125' : 'scale-100'}
              `}
              aria-label={`${label} (${count})`}
              title={label}
            >
              <span className={`transition-transform ${isCurrentlyAnimating ? 'animate-bounce' : ''}`}>
                {emoji}
              </span>
              {count > 0 && (
                <span className={`text-xs font-medium ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {totalReactions > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
        </p>
      )}
    </div>
  );
}
