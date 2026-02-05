/**
 * RAGChat Component
 * 
 * Main chat interface combining all components into a
 * production-ready conversational AI experience
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRAGChat } from './useRAGChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SourcePanel } from './SourcePanel';
import { SuggestedQuestions } from './SuggestedQuestions';
import { ProcessingIndicator } from './ProcessingIndicator';
import { SettingsPanel } from './SettingsPanel';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { MessageSearch } from './MessageSearch';
import { MessageSkeleton, WelcomeSkeleton } from './MessageSkeleton';
import { ErrorBoundary, MessageError, NetworkErrorBanner } from './ErrorBoundary';
import { RelatedArticles } from './RelatedArticles';
import type { Source, Conversation, ChatSettings, SuggestedQuestion } from './types';

interface RAGChatProps {
  conversationId?: string;
  onConversationChange?: (id: string) => void;
  showSidebar?: boolean;
  className?: string;
}

export function RAGChat({
  conversationId,
  onConversationChange,
  showSidebar = true,
  className = '',
}: RAGChatProps) {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    conversationId: currentConvId,
    currentStep,
    processingInfo,
    settings,
    sendMessage,
    stopStreaming,
    clearConversation,
    newConversation,
    loadConversation,
    deleteConversation,
    getConversations,
    sendFeedback,
    regenerateResponse,
    editMessage,
    exportConversation,
    copyLastResponse,
    updateSettings,
  } = useRAGChat({ conversationId });

  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Source[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(showSidebar);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // New panel states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow Escape in input
        if (e.key === 'Escape') {
          target.blur();
          return;
        }
        return;
      }

      // Global shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }
      
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        newConversation();
      }

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setShortcutsOpen(false);
        setSearchOpen(false);
        setSourcePanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newConversation]);

  // Load conversations on mount
  useEffect(() => {
    setConversations(getConversations());
  }, [getConversations]);

  // Update conversation list when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setConversations(getConversations());
    }
  }, [messages, getConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Notify parent of conversation change
  useEffect(() => {
    if (currentConvId) {
      onConversationChange?.(currentConvId);
    }
  }, [currentConvId, onConversationChange]);

  const handleCitationClick = useCallback((source: Source) => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage?.metadata?.sources) {
      setSelectedSources(lastAssistantMessage.metadata.sources);
      setSourcePanelOpen(true);
    }
  }, [messages]);

  const handleShowSources = useCallback(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage?.metadata?.sources) {
      setSelectedSources(lastAssistantMessage.metadata.sources);
      setSourcePanelOpen(true);
    }
  }, [messages]);

  const handleSelectConversation = useCallback((convId: string) => {
    loadConversation(convId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [loadConversation]);

  const handleNewChat = useCallback(() => {
    newConversation();
  }, [newConversation]);

  const handleDeleteConversation = useCallback((convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(convId);
    setConversations(getConversations());
  }, [deleteConversation, getConversations]);

  const handleFeedback = useCallback((messageId: string, rating: 'positive' | 'negative') => {
    sendFeedback(messageId, rating);
    showToast(rating === 'positive' ? 'Thanks for the feedback!' : 'Feedback noted, we\'ll improve', 'info');
  }, [sendFeedback, showToast]);

  // New handlers
  const handleRegenerate = useCallback(async () => {
    setIsRetrying(true);
    try {
      await regenerateResponse();
    } finally {
      setIsRetrying(false);
    }
  }, [regenerateResponse]);

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    editMessage(messageId, newContent);
  }, [editMessage]);

  const handleExport = useCallback((format: 'markdown' | 'json' | 'text') => {
    const exported = exportConversation(format);
    if (exported) {
      // Create and download file
      const blob = new Blob([exported], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${currentConvId || 'export'}.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported as ${format.toUpperCase()}`, 'success');
    }
  }, [exportConversation, currentConvId, showToast]);

  const handleCopyResponse = useCallback(async () => {
    const success = await copyLastResponse();
    if (success) {
      showToast('Response copied to clipboard', 'success');
    }
  }, [copyLastResponse, showToast]);

  const handleSettingsChange = useCallback((newSettings: ChatSettings) => {
    updateSettings(newSettings);
  }, [updateSettings]);

  const handleSearchResult = useCallback((messageId: string) => {
    setSearchOpen(false);
    // Scroll to message
    const element = document.getElementById(`message-${messageId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Highlight briefly
    element?.classList.add('ring-2', 'ring-blue-500');
    setTimeout(() => {
      element?.classList.remove('ring-2', 'ring-blue-500');
    }, 2000);
  }, []);

  const handleRetryConnection = useCallback(() => {
    setIsOffline(!navigator.onLine);
  }, []);

  const lastAssistantMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'assistant');
  const lastAssistantIndex = messages.length - 1 - messages.slice().reverse().findIndex((m: { role: string }) => m.role === 'assistant');
  const hasSources = lastAssistantMessage?.metadata?.sources && lastAssistantMessage.metadata.sources.length > 0;

  return (
    <ErrorBoundary>
    <div className={`flex h-full bg-gray-900 ${className}`}>
      {/* Network status banner */}
      <NetworkErrorBanner isOffline={isOffline} onRetryConnection={handleRetryConnection} />
      
      {/* Conversation Sidebar */}
      {showSidebar && (
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside className={`
            fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-gray-950 border-r border-gray-800
            transform transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Conversations
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                           bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                           transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`
                      w-full text-left p-3 rounded-lg transition-colors group relative
                      ${currentConvId === conv.id
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                      }
                    `}
                  >
                    <p className="font-medium text-sm truncate pr-8">
                      {conv.title || 'Untitled conversation'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {conv.messages?.length || 0} messages
                    </p>
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 
                                 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 
                                 transition-opacity rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </button>
                ))
              )}
            </div>
          </aside>
        </>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
          <div className="flex items-center gap-3">
            {showSidebar && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 
                              flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              <div>
                <h1 className="font-semibold text-white">Crypto News AI</h1>
                <p className="text-xs text-gray-500">Powered by RAG</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sources button */}
            {hasSources && (
              <button
                onClick={handleShowSources}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 
                           hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Sources
                <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                  {lastAssistantMessage?.metadata?.sources?.length}
                </span>
              </button>
            )}

            {/* Copy last response button */}
            {lastAssistantMessage && (
              <button
                onClick={handleCopyResponse}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Copy last response (Ctrl+C)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}

            {/* Search button */}
            {messages.length > 0 && (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Search messages (Ctrl+K)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {/* Export button */}
            {messages.length > 0 && (
              <div className="relative group">
                <button
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Export conversation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <div className="absolute right-0 top-full mt-1 py-1 bg-gray-800 border border-gray-700 rounded-lg
                                shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                transition-all duration-150 z-50 min-w-[120px]">
                  <button
                    onClick={() => handleExport('markdown')}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => handleExport('text')}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Plain Text
                  </button>
                </div>
              </div>
            )}

            {/* Settings button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Settings (Ctrl+,)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Help button */}
            <button
              onClick={() => setShortcutsOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Clear button */}
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {messages.length === 0 ? (
            // Welcome screen
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 
                              flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Crypto News AI Assistant
              </h2>
              <p className="text-gray-400 mb-8 max-w-md">
                Ask me anything about cryptocurrency news, market trends, Bitcoin, Ethereum, 
                DeFi, NFTs, regulations, and more. I'll find the most relevant information for you.
              </p>

              <SuggestedQuestions onSelect={sendMessage} />
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={message.id} id={`message-${message.id}`} className="transition-all duration-300">
                  <ChatMessage
                    message={message}
                    onCitationClick={handleCitationClick}
                    onFeedback={(rating) => handleFeedback(message.id, rating)}
                    showFeedback={message.role === 'assistant' && !message.isStreaming}
                    onRegenerate={handleRegenerate}
                    onEdit={(newContent) => handleEditMessage(message.id, newContent)}
                    showConfidence={settings.showConfidence}
                    isLastAssistant={message.role === 'assistant' && index === lastAssistantIndex}
                  />
                </div>
              ))}
              
              {/* Processing indicator */}
              {isLoading && !isStreaming && (
                <ProcessingIndicator 
                  step={currentStep} 
                  processingInfo={processingInfo}
                />
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error display with retry */}
        {error && (
          <div className="mx-4 mb-4">
            <MessageError 
              error={error} 
              onRetry={handleRegenerate}
              isRetrying={isRetrying}
            />
          </div>
        )}

        {/* Follow-up suggestions after response */}
        {messages.length > 0 && !isLoading && lastAssistantMessage && (
          <div className="px-4 pb-2 space-y-3">
            {/* Dynamic suggestions from API or fallback to static */}
            <SuggestedQuestions 
              questions={lastAssistantMessage.metadata?.suggestedQuestions}
              onSelect={sendMessage} 
              variant="compact"
              maxQuestions={4}
            />
            
            {/* Related articles from API */}
            {settings.showRelatedArticles && lastAssistantMessage.metadata?.relatedArticles && 
             lastAssistantMessage.metadata.relatedArticles.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <RelatedArticles 
                  articles={lastAssistantMessage.metadata.relatedArticles.map(a => ({
                    id: a.id,
                    title: a.title,
                    source: a.source,
                    url: a.url,
                    relevanceScore: a.similarity,
                  }))}
                  maxDisplay={3}
                />
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/95 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSend={sendMessage}
              onStop={stopStreaming}
              isLoading={isLoading}
              isStreaming={isStreaming}
            />
          </div>
        </div>
      </div>

      {/* Source Panel */}
      <SourcePanel
        sources={selectedSources}
        isOpen={sourcePanelOpen}
        onClose={() => setSourcePanelOpen(false)}
      />

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              isOpen={true}
              onClose={() => setSettingsOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {shortcutsOpen && (
        <KeyboardShortcuts isOpen={true} onClose={() => setShortcutsOpen(false)} />
      )}

      {/* Message Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-2xl h-[60vh]">
            <MessageSearch
              messages={messages}
              onResultClick={handleSearchResult}
              onClose={() => setSearchOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed bottom-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm
                      flex items-center gap-3 transition-all duration-200 animate-in slide-in-from-bottom-4
                      ${toast.type === 'success' ? 'bg-green-900/90 border border-green-500/50 text-green-100' :
                        toast.type === 'error' ? 'bg-red-900/90 border border-red-500/50 text-red-100' :
                        'bg-blue-900/90 border border-blue-500/50 text-blue-100'}`}
        >
          {toast.type === 'success' && (
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === 'error' && (
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.type === 'info' && (
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

export default RAGChat;
