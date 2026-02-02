'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  SparklesIcon, 
  PaperAirplaneIcon,
  ArrowPathIcon,
  ChartBarIcon,
  NewspaperIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    title: string;
    url: string;
    source: string;
  }>;
  data?: {
    type: 'price' | 'chart' | 'news' | 'analysis';
    value: unknown;
  };
  timestamp: Date;
}

const EXAMPLE_QUERIES = [
  { icon: NewspaperIcon, text: "What's the latest news on Bitcoin ETFs?" },
  { icon: ChartBarIcon, text: "Show me the top 5 movers today" },
  { icon: CurrencyDollarIcon, text: "What's the current fear & greed index?" },
  { icon: LightBulbIcon, text: "Summarize today's crypto headlines" },
];

export default function OraclePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call Oracle API
      const response = await fetch('/api/ai/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage.content,
          history: messages.slice(-6), // Last 3 exchanges for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        data: data.data,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (query: string) => {
    setInput(query);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      <Header />
      
      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Hero Section */}
        {messages.length === 0 && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-6">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              The Oracle
            </h1>
            <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
              Ask me anything about crypto markets, news, and trends. 
              I have access to real-time data from 130+ news sources and live market feeds.
            </p>
            
            {/* Example Queries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {EXAMPLE_QUERIES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example.text)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
                >
                  <example.icon className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-slate-300">{example.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-6 mb-6">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Sources:</p>
                    <div className="space-y-1">
                      {message.sources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          {source.title} — {source.source}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs mt-2 opacity-60">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2">
                  <ArrowPathIcon className="w-5 h-5 text-purple-500 animate-spin" />
                  <span className="text-gray-600 dark:text-slate-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="sticky bottom-4">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crypto news, prices, trends..."
              className="w-full px-5 py-4 pr-14 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-indigo-700 transition-all"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
