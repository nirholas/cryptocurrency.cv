/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────

export interface RAGSource {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt?: string;
  score: number;
  snippet?: string;
}

export interface RAGConfidence {
  overall: number;
  level: 'high' | 'medium' | 'low' | 'uncertain';
  factors: {
    sourceQuality: number;
    relevance: number;
    recency: number;
    consistency: number;
  };
  warnings?: string[];
}

export interface RAGStep {
  type: 'processing' | 'searching' | 'reranking' | 'generating';
  message: string;
}

export interface RAGQueryInfo {
  original: string;
  contextualized: string;
  intent: string;
  complexity: string;
  isFollowUp: boolean;
}

export interface RAGCompleteData {
  answer: string;
  sources: RAGSource[];
  confidence?: RAGConfidence;
  suggestions?: string[];
  relatedArticles?: RAGSource[];
  metadata?: {
    conversationId: string;
    queryIntent: string;
    documentsSearched: number;
    processingSteps: number;
  };
}

export interface RAGStreamState {
  /** Accumulated streamed text so far */
  text: string;
  /** True while the stream is open */
  loading: boolean;
  /** True once the stream completes */
  done: boolean;
  /** Non-null when an error occurred */
  error: string | null;
  /** Current pipeline step being executed */
  currentStep: RAGStep | null;
  /** All pipeline steps completed so far */
  steps: RAGStep[];
  /** Query analysis info */
  queryInfo: RAGQueryInfo | null;
  /** Number of retrieved documents */
  documentsFound: number;
  /** Sources used in the response */
  sources: RAGSource[];
  /** Confidence assessment */
  confidence: RAGConfidence | null;
  /** Suggested follow-up questions */
  suggestions: string[];
  /** Conversation ID for multi-turn context */
  conversationId: string | null;
  /** Start a new RAG stream */
  start: (query: string, conversationId?: string) => void;
  /** Reset all state */
  reset: () => void;
}

/**
 * useRAGStream — Hook for consuming the advanced RAG streaming endpoint.
 *
 * Handles named SSE events: start, step, query_info, retrieval, reranking, token, complete, error
 * from /api/rag/stream
 */
export function useRAGStream(): RAGStreamState {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<RAGStep | null>(null);
  const [steps, setSteps] = useState<RAGStep[]>([]);
  const [queryInfo, setQueryInfo] = useState<RAGQueryInfo | null>(null);
  const [documentsFound, setDocumentsFound] = useState(0);
  const [sources, setSources] = useState<RAGSource[]>([]);
  const [confidence, setConfidence] = useState<RAGConfidence | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setText('');
    setLoading(false);
    setDone(false);
    setError(null);
    setCurrentStep(null);
    setSteps([]);
    setQueryInfo(null);
    setDocumentsFound(0);
    setSources([]);
    setConfidence(null);
    setSuggestions([]);
    setConversationId(null);
  }, []);

  const start = useCallback((query: string, convId?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setDone(false);
    setError(null);
    setLoading(true);
    setCurrentStep(null);
    setSteps([]);
    setQueryInfo(null);
    setDocumentsFound(0);
    setSources([]);
    setConfidence(null);
    setSuggestions([]);

    (async () => {
      let response: Response;
      try {
        response = await fetch('/api/rag/stream', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            query,
            conversationId: convId,
            options: { useHyDE: true, useDecomposition: true },
          }),
        });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message || 'Network error');
        setLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        const msg = await response.text().catch(() => String(response.status));
        setError(`API error ${response.status}: ${msg}`);
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const eventBlock of events) {
            if (!eventBlock.trim()) continue;

            // Parse named SSE events: "event: name\ndata: {...}"
            const eventMatch = eventBlock.match(/^event:\s*(\w+)\ndata:\s*(.+)$/s);
            if (!eventMatch) {
              // Fallback: plain "data: ..." frames (for /api/ask compatibility)
              const dataMatch = eventBlock.match(/^data:\s*(.+)$/s);
              if (dataMatch) {
                if (dataMatch[1].trim() === '[DONE]') {
                  setDone(true);
                  setLoading(false);
                  return;
                }
                try {
                  const payload = JSON.parse(dataMatch[1]);
                  if (typeof payload.token === 'string') {
                    setText(prev => prev + payload.token);
                  }
                } catch { /* skip */ }
              }
              continue;
            }

            const eventName = eventMatch[1];
            let data: Record<string, unknown>;
            try {
              data = JSON.parse(eventMatch[2]);
            } catch {
              continue;
            }

            switch (eventName) {
              case 'start':
                setConversationId(data.conversationId as string);
                break;

              case 'step': {
                const step = { type: data.type as RAGStep['type'], message: data.message as string };
                setCurrentStep(step);
                setSteps(prev => [...prev, step]);
                break;
              }

              case 'query_info':
                setQueryInfo(data as unknown as RAGQueryInfo);
                break;

              case 'retrieval':
                setDocumentsFound(data.documentsFound as number);
                break;

              case 'reranking':
                // Reranking data arrives before generation
                break;

              case 'token':
                if (typeof data.content === 'string') {
                  setText(prev => prev + data.content);
                }
                break;

              case 'complete': {
                const complete = data as unknown as RAGCompleteData;
                if (complete.sources) setSources(complete.sources);
                if (complete.confidence) setConfidence(complete.confidence as RAGConfidence);
                if (complete.suggestions) setSuggestions(complete.suggestions);
                if (complete.metadata?.conversationId) {
                  setConversationId(complete.metadata.conversationId);
                }
                setDone(true);
                setLoading(false);
                return;
              }

              case 'error':
                setError(data.message as string);
                setLoading(false);
                return;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message || 'Stream error');
      } finally {
        reader.releaseLock();
        setLoading(false);
      }
    })();
  }, []);

  return {
    text,
    loading,
    done,
    error,
    currentStep,
    steps,
    queryInfo,
    documentsFound,
    sources,
    confidence,
    suggestions,
    conversationId,
    start,
    reset,
  };
}
