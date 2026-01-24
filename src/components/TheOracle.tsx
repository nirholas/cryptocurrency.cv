'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: {
    type: 'news' | 'market' | 'onchain' | 'social';
    title: string;
    url?: string;
  }[];
}

interface OracleResponse {
  answer: string;
  sources?: Message['sources'];
  confidence?: number;
}

const SUGGESTED_QUERIES = [
  "What's the latest news on Bitcoin ETFs?",
  "Why is Ethereum pumping today?",
  "What are the top DeFi protocols by TVL?",
  "Summarize the crypto market sentiment",
  "What regulatory news came out this week?",
  "Which coins are trending on social media?",
  "What's happening with Solana?",
  "Any major hacks or exploits recently?",
];

/**
 * The Oracle - AI-Powered Natural Language Query Interface
 * 
 * Allows users to ask questions about crypto news, markets, and data
 * in natural language and get AI-generated answers with sources.
 */
export function TheOracle() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: "I'm The Oracle, your AI-powered crypto intelligence assistant. Ask me anything about crypto news, market trends, DeFi protocols, on-chain data, or social sentiment.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data: OracleResponse = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
    handleSubmit(query);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'news':
        return '📰';
      case 'market':
        return '📊';
      case 'onchain':
        return '⛓️';
      case 'social':
        return '💬';
      default:
        return '📄';
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="text-3xl">🔮</div>
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            The Oracle
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            AI-powered crypto intelligence
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.role === 'system'
                  ? 'bg-purple-500/10 text-neutral-700 dark:text-neutral-300 border border-purple-500/20'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-200/50 dark:border-neutral-700/50">
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                    Sources:
                  </p>
                  <div className="space-y-1">
                    {message.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <span>{getSourceIcon(source.type)}</span>
                        <span className="truncate">{source.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested queries (only show when few messages) */}
      {messages.length < 3 && (
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            Suggested questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.slice(0, 4).map((query) => (
              <button
                key={query}
                onClick={() => handleSuggestedQuery(query)}
                className="text-xs px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(input);
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about crypto..."
            className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              'Ask'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TheOracle;
