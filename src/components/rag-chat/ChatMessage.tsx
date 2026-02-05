/**
 * ChatMessage Component
 * 
 * Renders individual chat messages with markdown support,
 * citations, code highlighting, and streaming animations
 */

'use client';

import { useRef, useEffect, useState, memo } from 'react';
import type { ChatMessage as ChatMessageType, Source } from './types';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (source: Source) => void;
  onFeedback?: (rating: 'positive' | 'negative') => void;
  showFeedback?: boolean;
}

function ChatMessageComponent({ 
  message, 
  onCitationClick, 
  onFeedback,
  showFeedback = true 
}: ChatMessageProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);

  // Auto-scroll when streaming
  useEffect(() => {
    if (message.isStreaming && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [message.content, message.isStreaming]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleFeedback = (rating: 'positive' | 'negative') => {
    if (feedbackGiven) return;
    setFeedbackGiven(rating);
    onFeedback?.(rating);
  };

  // Simple markdown parser
  const parseMarkdown = (text: string) => {
    // Handle code blocks first
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: (string | { type: 'code'; language?: string; content: string })[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push({
        type: 'code',
        language: match[1],
        content: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  // Process inline markdown
  const processInline = (text: string) => {
    // Handle citations [1], [2], etc
    const citationPattern = /\[(\d+)\]/g;
    let processed = text.replace(citationPattern, (match, num) => {
      return `<button class="citation-link" data-citation="${num}">[${num}]</button>`;
    });

    // Bold
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    // Links
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-400 hover:underline">$1</a>');
    // Line breaks
    processed = processed.replace(/\n/g, '<br />');

    return processed;
  };

  // Handle citation clicks
  useEffect(() => {
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('citation-link')) {
        const citationNum = parseInt(target.dataset.citation || '0', 10);
        const sources = message.metadata?.sources;
        if (sources && sources[citationNum - 1]) {
          onCitationClick?.(sources[citationNum - 1]);
        }
      }
    };

    const el = contentRef.current;
    el?.addEventListener('click', handleClick);
    return () => el?.removeEventListener('click', handleClick);
  }, [message.metadata?.sources, onCitationClick]);

  const isUser = message.role === 'user';
  const parsedContent = parseMarkdown(message.content);

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
      }`}>
        {isUser ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block p-4 rounded-2xl ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-800/60 border border-gray-700/50 rounded-bl-md'
        }`}>
          <div ref={contentRef} className="prose prose-invert prose-sm max-w-none">
            {parsedContent.map((part, i) => {
              if (typeof part === 'string') {
                return (
                  <div
                    key={i}
                    className="whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: processInline(part) }}
                  />
                );
              } else {
                return (
                  <div key={i} className="my-3 rounded-lg overflow-hidden bg-gray-900/80 border border-gray-700/50">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/50 border-b border-gray-700/50">
                      <span className="text-xs text-gray-400 font-mono">
                        {part.language || 'code'}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(part.content)}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-3 overflow-x-auto text-sm">
                      <code className="text-gray-300 font-mono">{part.content}</code>
                    </pre>
                  </div>
                );
              }
            })}

            {/* Streaming cursor */}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5" />
            )}
          </div>
        </div>

        {/* Message metadata and actions */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            {message.metadata?.sources && message.metadata.sources.length > 0 && (
              <span className="text-gray-400">
                {message.metadata.sources.length} source{message.metadata.sources.length !== 1 && 's'}
              </span>
            )}

            {/* Copy button */}
            <button
              onClick={copyToClipboard}
              className="hover:text-gray-300 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            {/* Feedback buttons */}
            {showFeedback && onFeedback && (
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => handleFeedback('positive')}
                  className={`p-1 rounded transition-colors ${
                    feedbackGiven === 'positive'
                      ? 'text-green-500 bg-green-500/10'
                      : 'hover:text-green-400 hover:bg-green-500/10'
                  }`}
                  disabled={feedbackGiven !== null}
                  title="Helpful"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </button>
                <button
                  onClick={() => handleFeedback('negative')}
                  className={`p-1 rounded transition-colors ${
                    feedbackGiven === 'negative'
                      ? 'text-red-500 bg-red-500/10'
                      : 'hover:text-red-400 hover:bg-red-500/10'
                  }`}
                  disabled={feedbackGiven !== null}
                  title="Not helpful"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Styles for citations
const citationStyles = `
.citation-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  margin: 0 0.125rem;
  font-size: 0.625rem;
  font-weight: 600;
  color: rgb(147, 197, 253);
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s;
  vertical-align: super;
}

.citation-link:hover {
  background: rgba(59, 130, 246, 0.3);
  color: rgb(191, 219, 254);
  transform: translateY(-1px);
}

.inline-code {
  padding: 0.125rem 0.375rem;
  font-size: 0.875em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.25rem;
  color: rgb(248, 113, 113);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'rag-chat-message-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = citationStyles;
    document.head.appendChild(style);
  }
}

export const ChatMessage = memo(ChatMessageComponent);
export default ChatMessage;
