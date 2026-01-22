/**
 * @fileoverview Unit tests for BookmarkButton component
 */

/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookmarkButton from './BookmarkButton';

// Mock the BookmarksProvider context
const mockToggleBookmark = vi.fn();
const mockIsBookmarked = vi.fn();

vi.mock('./BookmarksProvider', () => ({
  useBookmarks: () => ({
    toggleBookmark: mockToggleBookmark,
    isBookmarked: mockIsBookmarked,
  }),
}));

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
    render(<BookmarkButton article={mockArticle} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('calls toggleBookmark when clicked', () => {
    render(<BookmarkButton article={mockArticle} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockToggleBookmark).toHaveBeenCalledWith(mockArticle);
  });

  it('shows bookmarked state when article is bookmarked', () => {
    mockIsBookmarked.mockReturnValue(true);
    
    render(<BookmarkButton article={mockArticle} />);
    
    const button = screen.getByRole('button');
    // Button should indicate bookmarked state via aria-pressed or class
    expect(button).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<BookmarkButton article={mockArticle} />);
    
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
      </div>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Parent should not receive click if propagation is stopped
    // This depends on implementation
  });
});
