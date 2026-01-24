/**
 * useBookmarks Hook
 * 
 * Manages bookmarked articles with localStorage persistence.
 * Provides functions to save, remove, and check bookmarked articles.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BookmarkedArticle {
  id: string;
  slug: string;
  title: string;
  source: string;
  pubDate: string;
  description?: string;
  bookmarkedAt: string;
}

const STORAGE_KEY = 'fcn_bookmarks';
const MAX_BOOKMARKS = 100;

/**
 * Hook for managing article bookmarks
 * 
 * @example
 * const { bookmarks, isBookmarked, addBookmark, removeBookmark, toggleBookmark } = useBookmarks();
 * 
 * // Check if article is bookmarked
 * if (isBookmarked(article.id)) { ... }
 * 
 * // Toggle bookmark
 * toggleBookmark({
 *   id: article.id,
 *   slug: article.slug,
 *   title: article.title,
 *   source: article.source,
 *   pubDate: article.pubDate,
 * });
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setBookmarks(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
    setIsLoaded(true);
  }, []);

  // Persist bookmarks to localStorage
  const persistBookmarks = useCallback((newBookmarks: BookmarkedArticle[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }, []);

  // Check if an article is bookmarked
  const isBookmarked = useCallback((id: string): boolean => {
    return bookmarks.some(b => b.id === id);
  }, [bookmarks]);

  // Add a bookmark
  const addBookmark = useCallback((article: Omit<BookmarkedArticle, 'bookmarkedAt'>) => {
    if (isBookmarked(article.id)) return;

    const newBookmark: BookmarkedArticle = {
      ...article,
      bookmarkedAt: new Date().toISOString(),
    };

    const newBookmarks = [newBookmark, ...bookmarks].slice(0, MAX_BOOKMARKS);
    setBookmarks(newBookmarks);
    persistBookmarks(newBookmarks);
  }, [bookmarks, isBookmarked, persistBookmarks]);

  // Remove a bookmark
  const removeBookmark = useCallback((id: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(newBookmarks);
    persistBookmarks(newBookmarks);
  }, [bookmarks, persistBookmarks]);

  // Toggle bookmark status
  const toggleBookmark = useCallback((article: Omit<BookmarkedArticle, 'bookmarkedAt'>) => {
    if (isBookmarked(article.id)) {
      removeBookmark(article.id);
      return false;
    } else {
      addBookmark(article);
      return true;
    }
  }, [isBookmarked, addBookmark, removeBookmark]);

  // Clear all bookmarks
  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    persistBookmarks([]);
  }, [persistBookmarks]);

  // Get bookmarks count
  const count = bookmarks.length;

  return {
    bookmarks,
    isLoaded,
    count,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearBookmarks,
  };
}

export default useBookmarks;
