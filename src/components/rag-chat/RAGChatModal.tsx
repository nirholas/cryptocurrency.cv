/**
 * RAGChatModal Component
 * 
 * Global chat modal accessible via Cmd/Ctrl + K keyboard shortcut
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RAGChat } from './RAGChat';

interface RAGChatModalProps {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RAGChatModal({ defaultOpen = false, onOpenChange }: RAGChatModalProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);

  // Handle mount for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => {
          const next = !prev;
          onOpenChange?.(next);
          return next;
        });
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        role="presentation"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
        onKeyDown={handleClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 xl:inset-16 
                      animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
        <div className="relative w-full h-full bg-gray-900 rounded-2xl shadow-2xl 
                        border border-gray-700/50 overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white 
                       bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Keyboard hint */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">
              {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono">K</kbd>
            <span className="ml-1">to toggle</span>
          </div>

          {/* Chat */}
          <RAGChat showSidebar={false} className="pt-14" />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RAGChatModal;
