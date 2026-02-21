'use client';

import { useState, useRef, useEffect } from 'react';
import { useAIStream } from '@/hooks/useAIStream';

interface QAEntry {
  question: string;
  answer: string;
}

interface AskAboutThisProps {
  context: string;
  contextType: 'article' | 'coin' | 'general';
  placeholder?: string;
}

export function AskAboutThis({ context, contextType, placeholder }: AskAboutThisProps) {
  const [history, setHistory] = useState<QAEntry[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { text: streamText, loading, done, error, start, reset } = useAIStream();

  // When a stream completes, archive the last streamed answer into history
  const pendingQuestionRef = useRef('');
  useEffect(() => {
    if (done && pendingQuestionRef.current && streamText) {
      setHistory(prev => [
        { question: pendingQuestionRef.current, answer: streamText },
        ...prev,
      ].slice(0, 3));
      pendingQuestionRef.current = '';
    }
  }, [done, streamText]);

  const ask = (question: string) => {
    if (!question.trim() || loading) return;
    pendingQuestionRef.current = question.trim();
    reset();
    setInput('');
    start(`/api/ask?stream=true&q=${encodeURIComponent(question.trim())}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const handleClear = () => {
    reset();
    setHistory([]);
    pendingQuestionRef.current = '';
    inputRef.current?.focus();
  };

  const isStreaming = loading || (!!streamText && !done);
  const showClear = history.length > 0 || !!streamText;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-slate-700">
        <span className="text-lg flex-shrink-0">❓</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder || 'Ask AI a question...'}
          className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-black hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Thinking
            </span>
          ) : 'Ask'}
        </button>
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition"
          >
            Clear
          </button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Live streaming answer for current question */}
      {(isStreaming || (done && !!streamText && !history[0])) && (
        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs font-bold text-brand-600 dark:text-amber-400 mt-0.5">Q:</span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {pendingQuestionRef.current}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 mt-0.5">A:</span>
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {streamText}
              {loading && <span className="animate-pulse ml-0.5">▌</span>}
            </p>
          </div>
        </div>
      )}

      {/* Archived Q&A history */}
      {history.length > 0 && (
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {history.map((entry, i) => (
            <div key={i} className={`p-4 ${i > 0 ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xs font-bold text-brand-600 dark:text-amber-400 mt-0.5">Q:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.question}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-gray-400 dark:text-slate-500 mt-0.5">A:</span>
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {entry.answer}
                </p>
              </div>
            </div>
          ))}        </div>
      )}
    </div>
  );
}