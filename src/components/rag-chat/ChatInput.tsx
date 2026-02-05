/**
 * ChatInput Component
 * 
 * Multi-line input with voice support, send button,
 * stop generation control, and keyboard shortcuts
 */

'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';

const DRAFT_KEY = 'rag-chat-draft';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

function ChatInputComponent({
  onSend,
  onStop,
  isLoading = false,
  isStreaming = false,
  placeholder = 'Ask about crypto news, prices, trends...',
  disabled = false,
  maxLength = 2000,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Load saved draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        setInput(savedDraft);
      }
    }
  }, []);

  // Auto-save draft with debounce
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const saveTimer = setTimeout(() => {
      if (input.trim()) {
        localStorage.setItem(DRAFT_KEY, input);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    }, 500);
    
    return () => clearTimeout(saveTimer);
  }, [input]);

  // Check for voice support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setVoiceSupported(!!SpeechRecognition);
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const results = event.results;
          let transcript = '';
          for (let i = 0; i < results.length; i++) {
            transcript += results[i][0].transcript;
          }
          setInput(transcript);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        recognition.onerror = () => {
          setIsRecording(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed && !isLoading && !disabled) {
      onSend(trimmed);
      setInput('');
      // Clear the draft
      if (typeof window !== 'undefined') {
        localStorage.removeItem(DRAFT_KEY);
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const canSend = input.trim().length > 0 && !isLoading && !disabled;
  const showStop = isStreaming && onStop;

  return (
    <div className="relative">
      {/* Character count */}
      {input.length > maxLength * 0.8 && (
        <div className={`absolute -top-6 right-2 text-xs ${
          input.length > maxLength ? 'text-red-400' : 'text-gray-500'
        }`}>
          {input.length}/{maxLength}
        </div>
      )}

      <div className="relative flex items-end gap-2 p-3 bg-gray-800/60 border border-gray-700/50 
                      rounded-2xl focus-within:border-blue-500/50 focus-within:ring-1 
                      focus-within:ring-blue-500/20 transition-all">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none 
                     focus:outline-none text-sm leading-relaxed min-h-[24px] max-h-[200px]
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Voice button */}
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              disabled={isLoading}
              className={`p-2 rounded-xl transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isRecording ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                )}
              </svg>
            </button>
          )}

          {/* Stop / Send button */}
          {showStop ? (
            <button
              onClick={onStop}
              className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl 
                         transition-colors font-medium flex items-center gap-1.5"
              title="Stop generating"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`p-2.5 rounded-xl transition-all font-medium flex items-center gap-1.5 ${
                canSend
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              title={canSend ? 'Send message (Enter)' : 'Type a message'}
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 px-1">
        <span>
          Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">Enter</kbd> to send, 
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 ml-1">Shift + Enter</kbd> for new line
        </span>
        {isLoading && (
          <span className="flex items-center gap-1 text-blue-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            Processing...
          </span>
        )}
      </div>
    </div>
  );
}

// Add TypeScript declarations for Web Speech API
declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
    onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onerror: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
    prototype: SpeechRecognition;
  }

  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export const ChatInput = memo(ChatInputComponent);
export default ChatInput;
