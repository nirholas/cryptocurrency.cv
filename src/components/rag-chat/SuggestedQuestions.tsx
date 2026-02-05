/**
 * SuggestedQuestions Component
 * 
 * Displays suggested/example questions as clickable chips
 * with animated appearance and hover effects
 */

'use client';

import { memo } from 'react';
import type { SuggestedQuestion } from './types';
import { SUGGESTED_QUERIES } from './types';

interface SuggestedQuestionsProps {
  questions?: SuggestedQuestion[];
  onSelect: (question: string) => void;
  variant?: 'compact' | 'full';
  maxQuestions?: number;
}

function SuggestedQuestionsComponent({
  questions,
  onSelect,
  variant = 'full',
  maxQuestions = 6,
}: SuggestedQuestionsProps) {
  const displayQuestions = questions || SUGGESTED_QUERIES.slice(0, maxQuestions);

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'market':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'news':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'analysis':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'education':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {displayQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q.text)}
            className="px-3 py-1.5 text-xs bg-gray-800/60 hover:bg-gray-700/80 
                       text-gray-300 hover:text-white rounded-full border border-gray-700/50
                       hover:border-gray-600 transition-all duration-200"
          >
            {q.text}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Suggested Questions
      </h3>
      
      <div className="grid gap-2 sm:grid-cols-2">
        {displayQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q.text)}
            className="group flex items-start gap-3 p-3 text-left bg-gray-800/40 
                       hover:bg-gray-800/70 border border-gray-700/40 hover:border-gray-600/60
                       rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
            style={{
              animationDelay: `${i * 50}ms`,
            }}
          >
            <span className="flex-shrink-0 p-2 rounded-lg bg-gray-700/50 text-gray-400 
                             group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
              {getCategoryIcon(q.category)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-2">
                {q.text}
              </p>
              {q.category && (
                <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-gray-500">
                  {q.category}
                </span>
              )}
            </div>
            <svg className="flex-shrink-0 w-4 h-4 text-gray-600 group-hover:text-gray-400 
                            group-hover:translate-x-0.5 transition-all mt-1" 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

export const SuggestedQuestions = memo(SuggestedQuestionsComponent);
export default SuggestedQuestions;
