/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------
   Types
   ------------------------------------------------ */

export interface BookmarkedArticle {
  link: string;
  title: string;
  source: string;
  category: string;
  imageUrl?: string;
  savedAt: string;
}

interface BookmarksContextType {
  bookmarks: BookmarkedArticle[];
  addBookmark: (article: Omit<BookmarkedArticle, "savedAt">) => void;
  removeBookmark: (link: string) => void;
  isBookmarked: (link: string) => boolean;
  clearAll: () => void;
}

/* ------------------------------------------------
   Constants
   ------------------------------------------------ */

const STORAGE_KEY = "fcn-bookmarks";
const MAX_BOOKMARKS = 200;

/* ------------------------------------------------
   Context
   ------------------------------------------------ */

const BookmarksContext = createContext<BookmarksContextType>({
  bookmarks: [],
  addBookmark: () => {},
  removeBookmark: () => {},
  isBookmarked: () => false,
  clearAll: () => {},
});

export function useBookmarks() {
  return useContext(BookmarksContext);
}

/* ------------------------------------------------
   Helpers
   ------------------------------------------------ */

function loadBookmarks(): BookmarkedArticle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BookmarkedArticle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: BookmarkedArticle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    /* storage full or unavailable */
  }
}

/* ------------------------------------------------
   Provider
   ------------------------------------------------ */

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /* Hydrate from localStorage on mount */
  useEffect(() => {
    setBookmarks(loadBookmarks());
    setHydrated(true);
  }, []);

  /* Persist whenever bookmarks change (after hydration) */
  useEffect(() => {
    if (hydrated) {
      saveBookmarks(bookmarks);
    }
  }, [bookmarks, hydrated]);

  const addBookmark = useCallback(
    (article: Omit<BookmarkedArticle, "savedAt">) => {
      setBookmarks((prev) => {
        if (prev.some((b) => b.link === article.link)) return prev;
        const next = [
          { ...article, savedAt: new Date().toISOString() },
          ...prev,
        ];
        /* Enforce max limit */
        return next.slice(0, MAX_BOOKMARKS);
      });
    },
    [],
  );

  const removeBookmark = useCallback((link: string) => {
    setBookmarks((prev) => prev.filter((b) => b.link !== link));
  }, []);

  const isBookmarked = useCallback(
    (link: string) => bookmarks.some((b) => b.link === link),
    [bookmarks],
  );

  const clearAll = useCallback(() => {
    setBookmarks([]);
  }, []);

  const value = useMemo<BookmarksContextType>(
    () => ({ bookmarks, addBookmark, removeBookmark, isBookmarked, clearAll }),
    [bookmarks, addBookmark, removeBookmark, isBookmarked, clearAll],
  );

  return (
    <BookmarksContext value={value}>
      {children}
    </BookmarksContext>
  );
}
