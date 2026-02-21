/**
 * SourcePanel Component
 * 
 * Displays RAG sources in an expandable sidebar/panel with
 * relevance scores, direct links, and excerpts
 */

'use client';

import { useState, memo } from 'react';
import type { Source } from './types';
import { CONFIDENCE_COLORS } from './types';

interface SourcePanelProps {
  sources: Source[];
  isOpen: boolean;
  onClose: () => void;
  onSourceClick?: (source: Source) => void;
}

function SourcePanelComponent({ sources, isOpen, onClose, onSourceClick }: SourcePanelProps) {
  const [expandedSource, setExpandedSource] = useState<number | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return CONFIDENCE_COLORS.high;
    if (score >= 0.6) return CONFIDENCE_COLORS.medium;
    return CONFIDENCE_COLORS.low;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Highly Relevant';
    if (score >= 0.6) return 'Relevant';
    return 'Somewhat Relevant';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
        onKeyDown={onClose}
      />

      {/* Panel */}
      <div className={`
        fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 
        shadow-2xl z-50 transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="font-semibold text-white">Sources</h2>
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
              {sources.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Source List */}
        <div className="overflow-y-auto h-[calc(100%-60px)] p-4 space-y-3">
          {sources.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No sources for this response</p>
            </div>
          ) : (
            sources.map((source, index) => {
              const isExpanded = expandedSource === index;
              const scoreColor = getScoreColor(source.score);
              const formattedDate = formatDate(source.metadata?.date);

              return (
                <div
                  key={`${source.id}-${index}`}
                  className={`
                    rounded-xl border transition-all duration-200 overflow-hidden
                    ${isExpanded 
                      ? 'border-blue-500/50 bg-blue-500/5' 
                      : 'border-gray-800 bg-gray-800/30 hover:border-gray-700'
                    }
                  `}
                >
                  {/* Source Header */}
                  <button
                    onClick={() => setExpandedSource(isExpanded ? null : index)}
                    className="w-full p-3 text-left flex items-start gap-3"
                  >
                    {/* Index Badge */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gray-700/50 text-gray-300 
                                    flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white truncate text-sm">
                          {source.title || 'Untitled Source'}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {source.metadata?.source && (
                          <span className="truncate max-w-[120px]">
                            {source.metadata.source}
                          </span>
                        )}
                        {formattedDate && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span>{formattedDate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <div className={`px-2 py-0.5 rounded text-xs font-medium ${scoreColor.bg} ${scoreColor.text}`}>
                        {Math.round(source.score * 100)}%
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {getScoreLabel(source.score)}
                      </span>
                    </div>

                    {/* Expand Icon */}
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3 border-t border-gray-800/50">
                      {/* Excerpt */}
                      <div className="pt-3">
                        <p className="text-sm text-gray-300 leading-relaxed line-clamp-6">
                          {source.content || source.snippet || 'No content available'}
                        </p>
                      </div>

                      {/* Metadata */}
                      {source.metadata && Object.keys(source.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {source.metadata.category && (
                            <span className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded">
                              {source.metadata.category}
                            </span>
                          )}
                          {source.metadata.type && (
                            <span className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded">
                              {source.metadata.type}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                                       bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 
                                       transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open Source
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(source.content || source.snippet || '');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                                     bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 
                                     hover:text-gray-300 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy Text
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        {sources.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gray-900/95 border-t border-gray-800 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Relevance scores indicate how well sources match your query
              </span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${CONFIDENCE_COLORS.high.bg.replace('bg-', 'bg-')}`} />
                <span>&gt;80%</span>
                <span className={`w-2 h-2 rounded-full ${CONFIDENCE_COLORS.medium.bg.replace('bg-', 'bg-')}`} />
                <span>&gt;60%</span>
                <span className={`w-2 h-2 rounded-full ${CONFIDENCE_COLORS.low.bg.replace('bg-', 'bg-')}`} />
                <span>&lt;60%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export const SourcePanel = memo(SourcePanelComponent);
export default SourcePanel;
