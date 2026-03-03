"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAIStream } from "@/hooks/useAIStream";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Send,
  RotateCcw,
  Copy,
  Check,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  ArrowDown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

interface Citation {
  title: string;
  url: string;
  source?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

const MAX_MESSAGES = 50;

const SUGGESTED_QUESTIONS = [
  "What's happening in crypto today?",
  "Explain DeFi yield farming",
  "What is Bitcoin's current market sentiment?",
  "Latest Ethereum developments",
  "Compare Solana vs Ethereum",
];

// ── Component ──────────────────────────────────────────────────────

export function AIChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { text: streamedText, loading, done, error, start, reset: resetStream } = useAIStream();

  // Track whether we're currently streaming a response
  const streamingRef = useRef(false);
  const pendingQuestionRef = useRef<string>("");

  // ── Auto-scroll ────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedText, scrollToBottom]);

  // Show "scroll to bottom" when user scrolls up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const threshold = 100;
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      setShowScrollBtn(!atBottom);
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  // ── When streaming completes, finalize the assistant message ───

  useEffect(() => {
    if (done && streamingRef.current) {
      streamingRef.current = false;

      // Parse citations from the streamed text
      const { cleanText, citations } = extractCitations(streamedText);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: cleanText || streamedText,
          citations: citations.length > 0 ? citations : undefined,
          timestamp: new Date(),
        },
      ]);
      resetStream();
    }
  }, [done, streamedText, resetStream]);

  // Handle errors
  useEffect(() => {
    if (error && streamingRef.current) {
      streamingRef.current = false;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${error}. Please try again.`,
          timestamp: new Date(),
        },
      ]);
      resetStream();
    }
  }, [error, resetStream]);

  // ── Send message ───────────────────────────────────────────────

  const sendMessage = useCallback(
    (questionText?: string) => {
      const text = (questionText ?? input).trim();
      if (!text || loading) return;

      // Enforce max messages
      const newUserMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const next = [...prev, newUserMessage];
        // Keep last MAX_MESSAGES
        return next.slice(-MAX_MESSAGES);
      });

      setInput("");
      autoResizeTextarea("");

      streamingRef.current = true;
      pendingQuestionRef.current = text;

      start("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
    },
    [input, loading, start]
  );

  // ── New chat ───────────────────────────────────────────────────

  const newChat = useCallback(() => {
    setMessages([]);
    resetStream();
    streamingRef.current = false;
    setInput("");
    textareaRef.current?.focus();
  }, [resetStream]);

  // ── Copy conversation ──────────────────────────────────────────

  const copyConversation = useCallback(async () => {
    const text = messages
      .map((m) => `${m.role === "user" ? "You" : "AI"}: ${m.content}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [messages]);

  // ── Keyboard handling ──────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Auto-resize textarea ───────────────────────────────────────

  const autoResizeTextarea = (value: string) => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      if (value) {
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResizeTextarea(e.target.value);
  };

  // ── Empty state ────────────────────────────────────────────────

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-200 min-h-125">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold">Ask AI</h2>
            <p className="text-xs text-text-tertiary">
              Powered by crypto news intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyConversation}
                title="Copy conversation"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="hidden sm:inline text-xs">
                  {copied ? "Copied" : "Share"}
                </span>
              </Button>
              <Button variant="ghost" size="sm" onClick={newChat} title="New chat">
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">New Chat</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-4 pr-1 relative"
      >
        {isEmpty ? (
          <EmptyState onSelectQuestion={sendMessage} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Streaming response in progress */}
            {loading && streamedText && (
              <div className="flex gap-3">
                <AvatarIcon role="assistant" />
                <div className="flex-1 max-w-[85%] rounded-xl bg-surface-secondary p-4">
                  <MarkdownRenderer content={streamedText} />
                  <StreamingDots />
                </div>
              </div>
            )}

            {/* Loading indicator (no text yet) */}
            {loading && !streamedText && (
              <div className="flex gap-3">
                <AvatarIcon role="assistant" />
                <div className="rounded-xl bg-surface-secondary p-4">
                  <StreamingDots />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <div className="flex justify-center -mt-10 relative z-10">
          <button
            onClick={scrollToBottom}
            className="rounded-full bg-surface-secondary border border-border p-2 shadow-md hover:bg-surface-tertiary transition-colors"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about crypto..."
              disabled={loading}
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border border-border bg-(--color-surface) px-4 py-3 text-sm",
                "placeholder:text-text-tertiary",
                "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all"
              )}
            />
          </div>
          <Button
            variant="primary"
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            title="Send message"
            className="shrink-0 rounded-xl h-11.5 w-11.5"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-text-tertiary text-center mt-2">
          AI responses are generated from recent crypto news. Not financial advice.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function EmptyState({ onSelectQuestion }: { onSelectQuestion: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-6">
        <MessageSquare className="w-8 h-8 text-accent" />
      </div>
      <h3 className="font-serif text-xl font-bold mb-2">Ask anything about crypto</h3>
      <p className="text-sm text-text-secondary mb-8 text-center max-w-md">
        Get AI-powered answers based on the latest crypto news from 300+ sources.
      </p>

      <div className="grid gap-2 w-full max-w-lg">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelectQuestion(q)}
            className={cn(
              "text-left px-4 py-3 rounded-xl border border-border",
              "bg-(--color-surface) hover:bg-surface-secondary",
              "text-sm text-text-primary",
              "transition-colors cursor-pointer",
              "flex items-center gap-3"
            )}
          >
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <AvatarIcon role={message.role} />
      <div
        className={cn(
          "max-w-[85%] rounded-xl p-4",
          isUser
            ? "bg-accent text-white"
            : "bg-surface-secondary"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/30">
            {message.citations.map((cite, i) => (
              <a
                key={i}
                href={cite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Badge className="text-[10px] cursor-pointer hover:opacity-80 transition-opacity">
                  {cite.source || cite.title}
                </Badge>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AvatarIcon({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-1",
        role === "assistant"
          ? "bg-accent/10 text-accent"
          : "bg-surface-tertiary text-text-secondary"
      )}
    >
      {role === "assistant" ? (
        <Bot className="w-4 h-4" />
      ) : (
        <User className="w-4 h-4" />
      )}
    </div>
  );
}

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Extract citation references from AI response text.
 * Expects patterns like [Source Title](url) at the end, or a "Sources:" section.
 */
function extractCitations(text: string): { cleanText: string; citations: Citation[] } {
  const citations: Citation[] = [];

  // Look for a "Sources:" or "References:" section at the end
  const sourcesSectionMatch = text.match(
    /\n\n(?:Sources|References|Citations):\s*\n([\s\S]+)$/i
  );

  let cleanText = text;

  if (sourcesSectionMatch) {
    cleanText = text.slice(0, sourcesSectionMatch.index).trim();
    const sourcesBlock = sourcesSectionMatch[1];

    // Parse markdown links from the sources section
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = linkPattern.exec(sourcesBlock)) !== null) {
      citations.push({
        title: match[1],
        url: match[2],
        source: match[1],
      });
    }

    // Also parse plain URLs with bullet points: - Source Name: https://...
    const plainPattern = /[-•]\s*(.+?):\s*(https?:\/\/\S+)/g;
    while ((match = plainPattern.exec(sourcesBlock)) !== null) {
      citations.push({
        title: match[1].trim(),
        url: match[2],
        source: match[1].trim(),
      });
    }
  }

  return { cleanText, citations };
}
