/**
 * Saved Articles (Bookmarks) Page
 * View and manage saved articles
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useBookmarks, type BookmarkedArticle } from '@/components/BookmarksProvider';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
}

function BookmarkCard({ 
  bookmark, 
  onRemove 
}: { 
  bookmark: BookmarkedArticle; 
  onRemove: (link: string) => void;
}) {
  return (
    <article className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <a
            href={bookmark.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
              {bookmark.title}
            </h2>
          </a>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-slate-500">
            <span className="font-medium px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">
              {bookmark.source}
            </span>
            <span>Saved {formatTimeAgo(bookmark.savedAt)}</span>
          </div>
        </div>
        <button
          onClick={() => onRemove(bookmark.link)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          aria-label="Remove bookmark"
          title="Remove from saved"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </article>
  );
}

export default function SavedPage() {
  const { bookmarks, removeBookmark, clearAll } = useBookmarks();
  const [mounted, setMounted] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until client-side to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <Header />
          <main className="px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
              <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-slate-700 rounded"></div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-brand-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 dark:text-white font-medium">Saved Articles</li>
            </ol>
          </nav>
          
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-4xl">🔖</span>
                Saved Articles
              </h1>
              <p className="text-gray-600 dark:text-slate-400 mt-1">
                {bookmarks.length} article{bookmarks.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            
            {bookmarks.length > 0 && (
              <div className="relative">
                {showClearConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Clear all?</span>
                    <button
                      onClick={() => {
                        clearAll();
                        setShowClearConfirm(false);
                      }}
                      className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Bookmarks List */}
          {bookmarks.length > 0 ? (
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.link}
                  bookmark={bookmark}
                  onRemove={removeBookmark}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No saved articles yet
              </h2>
              <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Click the bookmark icon on any article to save it for later reading. 
                Your bookmarks are stored locally in your browser.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Browse News
              </Link>
            </div>
          )}
          
          {/* Info Box */}
          <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                  About Saved Articles
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Your saved articles are stored locally in your browser. They won&apos;t sync across devices 
                  and will be lost if you clear your browser data. For permanent storage, we recommend 
                  using the external article links.
                </p>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
