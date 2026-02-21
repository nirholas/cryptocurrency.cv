/**
 * useAIStream — Universal hook for consuming Server-Sent Events from AI routes.
 *
 * The hook handles:
 *  - Opening and reading an SSE stream (fetch-based, edge-compatible)
 *  - Parsing frames in `data: {"token":"..."}` format emitted by callGroqStream /
 *    aiCompleteStream
 *  - A `data: [DONE]` terminal frame
 *  - Abort-on-unmount and manual abort
 *
 * Usage example:
 * ```tsx
 * const { text, loading, done, error, start, reset } = useAIStream();
 *
 * // Trigger streaming from a GET endpoint:
 * <button onClick={() => start('/api/ask?q=What+is+BTC?&stream=true')}>Ask</button>
 *
 * // Or from a POST endpoint:
 * <button onClick={() => start('/api/ai/digest', { method: 'POST', body: JSON.stringify({ topic }) })}>Digest</button>
 * ```
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface AIStreamState {
  /** Accumulated streamed text so far. */
  text: string;
  /** True while the stream is open and tokens are arriving. */
  loading: boolean;
  /** True once the terminal `[DONE]` frame has been received.  */
  done: boolean;
  /** Non-null when the fetch or parsing failed. */
  error: string | null;
  /**
   * Open a new SSE stream.
   * @param url  URL to fetch (GET or POST, must return SSE)
   * @param init Optional fetch init — set method/headers/body for POST streams.
   */
  start: (url: string, init?: RequestInit) => void;
  /** Cancel an in-flight stream and reset all state. */
  reset: () => void;
}

export function useAIStream(): AIStreamState {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort in-flight stream on unmount
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
  }, []);

  const start = useCallback((url: string, init?: RequestInit) => {
    // Cancel any in-flight stream first
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setDone(false);
    setError(null);
    setLoading(true);

    (async () => {
      let response: Response;
      try {
        response = await fetch(url, {
          ...init,
          signal: controller.signal,
          headers: {
            Accept: 'text/event-stream',
            ...(init?.headers ?? {}),
          },
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
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const raw = line.trim();
            if (!raw) continue;

            // Terminal frame
            if (raw === 'data: [DONE]') {
              setDone(true);
              setLoading(false);
              return;
            }

            if (!raw.startsWith('data: ')) continue;

            try {
              const payload = JSON.parse(raw.slice(6)) as Record<string, unknown>;
              const token = payload.token;
              if (typeof token === 'string' && token) {
                setText(prev => prev + token);
              }
            } catch {
              // Malformed chunk — skip silently
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

  return { text, loading, done, error, start, reset };
}
