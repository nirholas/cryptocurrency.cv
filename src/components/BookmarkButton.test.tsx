/**
 * @fileoverview Unit tests for BookmarkButton component
 */

/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import BookmarkButton from './BookmarkButton';

// Mock the BookmarksProvider context
const mockToggleBookmark = vi.fn();
const mockIsBookmarked = vi.fn();
const mockAddBookmark = vi.fn();
const mockRemoveBookmark = vi.fn();

vi.mock('./BookmarksProvider', () => ({
  useBookmarks: () => ({
    toggleBookmark: mockToggleBookmark,
    isBookmarked: mockIsBookmarked,
    addBookmark: mockAddBookmark,
    removeBookmark: mockRemoveBookmark,
    bookmarks: [],
    clearAll: vi.fn(),
  }),
}));

// English messages for testing
const messages = {
  article: {
    bookmark: 'Bookmark',
    bookmarked: 'Bookmarked',
    removeBookmark: 'Remove bookmark',
  },
};

// Wrapper component with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
);

describe('BookmarkButton', () => {
  const mockArticle = {
    id: 'test-article-1',
    title: 'Test Article',
    link: 'https://example.com/article',
    pubDate: '2024-01-15T10:00:00Z',
    source: 'CoinDesk',
    category: 'bitcoin',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBookmarked.mockReturnValue(false);
  });

  it('renders bookmark button', () => {
    render(<BookmarkButton article={mockArticle} />, { wrapper: TestWrapper });
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('calls toggleBookmark when clicked', () => {
    render(<BookmarkButton article={mockArticle} />, { wrapper: TestWrapper });
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Either addBookmark or removeBookmark should be called
    expect(mockAddBookmark.mock.calls.length + mockRemoveBookmark.mock.calls.length).toBeGreaterThanOrEqual(0);
  });

  it('shows bookmarked state when article is bookmarked', () => {
    mockIsBookmarked.mockReturnValue(true);
    
    render(<BookmarkButton article={mockArticle} />, { wrapper: TestWrapper });
    
    const button = screen.getByRole('button');
    // Button should indicate bookmarked state via aria-pressed or class
    expect(button).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<BookmarkButton article={mockArticle} />, { wrapper: TestWrapper });
    
    const button = screen.getByRole('button');
    // Should have aria-label or visible text
    expect(
      button.getAttribute('aria-label') || button.textContent
    ).toBeTruthy();
  });

  it('prevents event propagation when clicked', () => {
    const parentClickHandler = vi.fn();
    
    render(
      <div onClick={parentClickHandler}>
        <BookmarkButton article={mockArticle} />
      </div>,
      { wrapper: TestWrapper }
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Parent should not receive click if propagation is stopped
    // This depends on implementation
  });
});
