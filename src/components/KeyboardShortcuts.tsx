/**
 * @fileoverview Keyboard Shortcuts Provider
 * 
 * Provides global keyboard navigation for power users. Wraps the application
 * to enable keyboard-driven navigation throughout all pages.
 * 
 * @module components/KeyboardShortcuts
 * @requires next/navigation
 * @requires ./ThemeProvider
 * 
 * @example
 * // In layout.tsx
 * import { KeyboardShortcutsProvider } from '@/components/KeyboardShortcuts';
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <KeyboardShortcutsProvider>
 *       {children}
 *     </KeyboardShortcutsProvider>
 *   );
 * }
 * 
 * ## Keyboard Shortcuts
 * 
 * ### Navigation
 * | Key | Action |
 * |-----|--------|
 * | `j` | Select next article |
 * | `k` | Select previous article |
 * | `Enter` | Open selected article |
 * | `Escape` | Close modal / blur input |
 * 
 * ### Quick Access (g + key)
 * | Key | Action |
 * |-----|--------|
 * | `g h` | Go to Home |
 * | `g t` | Go to Trending |
 * | `g s` | Go to Sources |
 * | `g b` | Go to Bookmarks |
 * | `g r` | Go to Read Later |
 * | `g w` | Go to Watchlist |
 * | `g p` | Go to Portfolio |
 * | `g c` | Go to Compare |
 * | `g ,` | Go to Settings |
 * 
 * ### Actions
 * | Key | Action |
 * |-----|--------|
 * | `/` or `Cmd+K` | Open search |
 * | `d` | Toggle dark mode |
 * | `?` | Show shortcuts help modal |
 * | `w` | Toggle watchlist (on coin page) |
 * | `a` | Open alert modal (on coin page) |
 * 
 * @see {@link https://docs.free-crypto-news.com/user-guide#keyboard-shortcuts User Guide}
 */
'use client';

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';

interface ShortcutsContextType {
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  openSearch: boolean;
  setOpenSearch: (open: boolean) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [gPressed, setGPressed] = useState(false);
  const router = useRouter();
  const { toggleTheme } = useTheme();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape in inputs to blur
      if (e.key === 'Escape') {
        target.blur();
      }
      return;
    }

    // Cmd+K or Ctrl+K to open search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpenSearch(true);
      return;
    }

    // Handle 'g' prefix shortcuts
    if (gPressed) {
      setGPressed(false);
      switch (e.key.toLowerCase()) {
        case 'h':
          e.preventDefault();
          router.push('/');
          return;
        case 't':
          e.preventDefault();
          router.push('/trending');
          return;
        case 's':
          e.preventDefault();
          router.push('/sources');
          return;
        case 'b':
          e.preventDefault();
          router.push('/bookmarks');
          return;
        case 'r':
          e.preventDefault();
          router.push('/read');
          return;
        case 'w':
          e.preventDefault();
          router.push('/watchlist');
          return;
        case 'p':
          e.preventDefault();
          router.push('/portfolio');
          return;
        case 'c':
          e.preventDefault();
          router.push('/compare');
          return;
        case ',':
          e.preventDefault();
          router.push('/settings');
          return;
      }
    }

    switch (e.key) {
      case 'g':
        setGPressed(true);
        setTimeout(() => setGPressed(false), 1000);
        break;

      case '/':
        e.preventDefault();
        setOpenSearch(true);
        break;

      case '?':
        e.preventDefault();
        setShowHelp(true);
        break;

      case 'Escape':
        setShowHelp(false);
        setOpenSearch(false);
        setGPressed(false);
        break;

      case 'd':
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          toggleTheme();
        }
        break;

      case 'w':
        // Toggle watchlist on coin pages - dispatch custom event
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          const event = new CustomEvent('toggleWatchlist');
          window.dispatchEvent(event);
        }
        break;

      case 'a':
        // Open alert modal on coin pages - dispatch custom event
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          const event = new CustomEvent('openAlertModal');
          window.dispatchEvent(event);
        }
        break;

      case 'j':
      case 'k':
        // Article navigation
        const articles = document.querySelectorAll<HTMLElement>('[data-article]');
        if (articles.length === 0) return;

        const focusedIndex = Array.from(articles).findIndex(
          (el) => el === document.activeElement || el.contains(document.activeElement)
        );

        let nextIndex: number;
        if (e.key === 'j') {
          nextIndex = focusedIndex === -1 ? 0 : Math.min(focusedIndex + 1, articles.length - 1);
        } else {
          nextIndex = focusedIndex === -1 ? 0 : Math.max(focusedIndex - 1, 0);
        }

        const nextArticle = articles[nextIndex];
        const link = nextArticle.querySelector<HTMLAnchorElement>('a');
        if (link) {
          link.focus();
          nextArticle.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;

      case 'Enter':
        // Open focused article
        if (document.activeElement?.tagName === 'A') {
          (document.activeElement as HTMLAnchorElement).click();
        }
        break;
    }
  }, [gPressed, router, toggleTheme]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <ShortcutsContext.Provider value={{ showHelp, setShowHelp, openSearch, setOpenSearch }}>
      {children}
      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}
    </ShortcutsContext.Provider>
  );
}

// Shortcuts help modal
function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['j'], description: 'Next article' },
      { keys: ['k'], description: 'Previous article' },
      { keys: ['Enter'], description: 'Open article' },
      { keys: ['⌘/Ctrl', 'K'], description: 'Open search', separator: '+' },
      { keys: ['/'], description: 'Open search' },
    ]},
    { category: 'Go to', items: [
      { keys: ['g', 'h'], description: 'Home' },
      { keys: ['g', 't'], description: 'Trending' },
      { keys: ['g', 's'], description: 'Sources' },
      { keys: ['g', 'b'], description: 'Bookmarks' },
      { keys: ['g', 'r'], description: 'Reader' },
      { keys: ['g', 'w'], description: 'Watchlist' },
      { keys: ['g', 'p'], description: 'Portfolio' },
      { keys: ['g', 'c'], description: 'Compare' },
      { keys: ['g', ','], description: 'Settings' },
    ]},
    { category: 'Actions', items: [
      { keys: ['d'], description: 'Toggle dark mode' },
      { keys: ['w'], description: 'Toggle watchlist (coin page)' },
      { keys: ['a'], description: 'Add price alert (coin page)' },
      { keys: ['?'], description: 'Show shortcuts' },
      { keys: ['Esc'], description: 'Close dialog' },
    ]},
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut) => (
                  <div key={shortcut.description} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-gray-400 mx-1">
                              {'separator' in shortcut ? shortcut.separator : 'then'}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}
