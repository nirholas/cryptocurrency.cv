/**
 * useRAGChat Hook
 * 
 * Manages RAG chat state, streaming, and conversation persistence
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  ChatMessage, 
  Conversation, 
  ChatSettings, 
  Source, 
  ConfidenceScore,
  SuggestedQuestion,
  DEFAULT_CHAT_SETTINGS 
} from './types';

interface UseRAGChatOptions {
  conversationId?: string;
  settings?: Partial<ChatSettings>;
  onMessageComplete?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
}

interface RAGChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  conversationId: string | null;
  currentStep: string | null;
  processingInfo: {
    intent?: string;
    complexity?: string;
    documentsFound?: number;
  } | null;
}

export function useRAGChat(options: UseRAGChatOptions = {}) {
  const [state, setState] = useState<RAGChatState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    error: null,
    conversationId: options.conversationId || null,
    currentStep: null,
    processingInfo: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageRef = useRef<string>('');

  // Generate unique ID
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Load conversation from localStorage
  useEffect(() => {
    if (options.conversationId) {
      const saved = localStorage.getItem(`rag-conv-${options.conversationId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setState(prev => ({
            ...prev,
            messages: parsed.messages.map((m: ChatMessage) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
            conversationId: options.conversationId || null,
          }));
        } catch (e) {
          console.error('Failed to load conversation:', e);
        }
      }
    }
  }, [options.conversationId]);

  // Save conversation to localStorage
  const saveConversation = useCallback((messages: ChatMessage[], convId: string) => {
    const conversation: Conversation = {
      id: convId,
      title: messages[0]?.content.slice(0, 50) || 'New conversation',
      messages,
      createdAt: new Date(messages[0]?.timestamp || Date.now()),
      updatedAt: new Date(),
      metadata: {
        messageCount: messages.length,
      },
    };
    localStorage.setItem(`rag-conv-${convId}`, JSON.stringify(conversation));
    
    // Update conversation list
    const listKey = 'rag-conversations';
    const list = JSON.parse(localStorage.getItem(listKey) || '[]');
    const existingIndex = list.findIndex((c: { id: string }) => c.id === convId);
    const summary = {
      id: convId,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      messageCount: messages.length,
    };
    if (existingIndex >= 0) {
      list[existingIndex] = summary;
    } else {
      list.unshift(summary);
    }
    localStorage.setItem(listKey, JSON.stringify(list.slice(0, 50)));
  }, []);

  // Send message with streaming
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      isLoading: true,
      isStreaming: true,
      error: null,
      currentStep: 'Starting...',
    }));

    streamingMessageRef.current = '';

    try {
      const response = await fetch('/api/rag/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: content.trim(),
          conversationId: state.conversationId,
          options: {
            useHyDE: true,
            useDecomposition: true,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalSources: Source[] = [];
      let finalMetadata: ChatMessage['metadata'] = {};
      let receivedConvId = state.conversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7);
            continue;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Handle different event types based on data structure
              if (data.conversationId && data.timestamp) {
                // start event
                receivedConvId = data.conversationId;
                setState(prev => ({ ...prev, conversationId: data.conversationId }));
              } else if (data.type && data.message) {
                // step event
                setState(prev => ({ ...prev, currentStep: data.message }));
              } else if (data.original && data.intent) {
                // query_info event
                setState(prev => ({
                  ...prev,
                  processingInfo: {
                    intent: data.intent,
                    complexity: data.complexity,
                  },
                }));
              } else if (data.documentsFound !== undefined) {
                // retrieval event
                setState(prev => ({
                  ...prev,
                  processingInfo: {
                    ...prev.processingInfo,
                    documentsFound: data.documentsFound,
                  },
                }));
              } else if (data.content !== undefined) {
                // token event
                streamingMessageRef.current += data.content;
                setState(prev => ({
                  ...prev,
                  messages: prev.messages.map((m, i) =>
                    i === prev.messages.length - 1
                      ? { ...m, content: streamingMessageRef.current }
                      : m
                  ),
                }));
              } else if (data.answer !== undefined) {
                // complete event
                finalSources = data.sources || [];
                finalMetadata = {
                  sources: data.sources,
                  queryIntent: data.metadata?.queryIntent,
                  documentsSearched: data.metadata?.documentsSearched,
                  conversationId: data.metadata?.conversationId,
                };
              } else if (data.message && !data.type) {
                // error event
                throw new Error(data.message);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }

      // Finalize the assistant message
      const finalMessage: ChatMessage = {
        id: assistantMessage.id,
        role: 'assistant',
        content: streamingMessageRef.current || "I couldn't generate a response. Please try again.",
        timestamp: new Date(),
        isStreaming: false,
        metadata: finalMetadata,
      };

      setState(prev => {
        const newMessages = prev.messages.map((m, i) =>
          i === prev.messages.length - 1 ? finalMessage : m
        );
        
        // Save conversation
        if (receivedConvId) {
          saveConversation(newMessages, receivedConvId);
        }

        return {
          ...prev,
          messages: newMessages,
          isLoading: false,
          isStreaming: false,
          currentStep: null,
          conversationId: receivedConvId,
        };
      });

      options.onMessageComplete?.(finalMessage);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setState(prev => ({
        ...prev,
        messages: prev.messages.map((m, i) =>
          i === prev.messages.length - 1
            ? { ...m, content: `Sorry, I encountered an error: ${errorMessage}`, isStreaming: false }
            : m
        ),
        isLoading: false,
        isStreaming: false,
        error: errorMessage,
        currentStep: null,
      }));

      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [state.isLoading, state.conversationId, saveConversation, options]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isLoading: false,
      isStreaming: false,
      currentStep: null,
      messages: prev.messages.map((m, i) =>
        i === prev.messages.length - 1 && m.isStreaming
          ? { ...m, isStreaming: false, content: m.content || 'Response was stopped.' }
          : m
      ),
    }));
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    if (state.conversationId) {
      localStorage.removeItem(`rag-conv-${state.conversationId}`);
    }
    setState({
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      conversationId: null,
      currentStep: null,
      processingInfo: null,
    });
  }, [state.conversationId]);

  // Start new conversation
  const newConversation = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      conversationId: null,
      currentStep: null,
      processingInfo: null,
    });
  }, []);

  // Load conversation by ID
  const loadConversation = useCallback((convId: string) => {
    const saved = localStorage.getItem(`rag-conv-${convId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({
          messages: parsed.messages.map((m: ChatMessage) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
          isLoading: false,
          isStreaming: false,
          error: null,
          conversationId: convId,
          currentStep: null,
          processingInfo: null,
        });
      } catch (e) {
        console.error('Failed to load conversation:', e);
      }
    }
  }, []);

  // Get all conversations
  const getConversations = useCallback((): Conversation[] => {
    const list = JSON.parse(localStorage.getItem('rag-conversations') || '[]');
    return list;
  }, []);

  // Delete conversation
  const deleteConversation = useCallback((convId: string) => {
    localStorage.removeItem(`rag-conv-${convId}`);
    const list = JSON.parse(localStorage.getItem('rag-conversations') || '[]');
    const filtered = list.filter((c: { id: string }) => c.id !== convId);
    localStorage.setItem('rag-conversations', JSON.stringify(filtered));
    
    if (state.conversationId === convId) {
      newConversation();
    }
  }, [state.conversationId, newConversation]);

  // Send feedback
  const sendFeedback = useCallback(async (messageId: string, rating: 'positive' | 'negative', comment?: string) => {
    try {
      await fetch('/api/rag/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          conversationId: state.conversationId,
          rating,
          comment,
        }),
      });
    } catch (e) {
      console.error('Failed to send feedback:', e);
    }
  }, [state.conversationId]);

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    error: state.error,
    conversationId: state.conversationId,
    currentStep: state.currentStep,
    processingInfo: state.processingInfo,
    
    // Actions
    sendMessage,
    stopStreaming,
    clearConversation,
    newConversation,
    loadConversation,
    deleteConversation,
    getConversations,
    sendFeedback,
  };
}

export default useRAGChat;
