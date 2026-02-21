/**
 * @fileoverview Unit tests for NewsCard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Module mocks (must be before any component import)
// ---------------------------------------------------------------------------

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  getPathname: () => '/',
}));

vi.mock('@/lib/archive-v2', () => ({
  generateArticleSlug: (_title: string, _date: string) => 'mock-slug',
}));

vi.mock('@/lib/reading-time', () => ({
  estimateReadingTime: () => 3,
}));

vi.mock('./BookmarksProvider', () => ({
  useBookmarks: () => ({
    isBookmarked: () => false,
    addBookmark: vi.fn(),
    removeBookmark: vi.fn(),
  }),
}));

vi.mock('./ClickbaitDetector', () => ({
  ClickbaitDetector: () => null,
}));

vi.mock('./cards/CardImage', () => ({
  default: ({ alt }: { alt: string }) =>
    React.createElement('img', { alt, 'data-testid': 'card-image' }),
}));

import NewsCard from './NewsCard';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseArticle = {
  title: 'Bitcoin Surges Past $100k',
  link: 'https://coindesk.com/bitcoin-100k',
  description: 'Bitcoin hit a new all-time high this week.',
  pubDate: '2026-02-21T10:00:00.000Z',
  source: 'CoinDesk',
  timeAgo: '2h ago',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NewsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the article title', () => {
    render(<NewsCard article={baseArticle} />);
    expect(screen.getByText('Bitcoin Surges Past $100k')).toBeInTheDocument();
  });

  it('renders the article source', () => {
    render(<NewsCard article={baseArticle} />);
    expect(screen.getByText('CoinDesk')).toBeInTheDocument();
  });

  it('renders the article description by default', () => {
    render(<NewsCard article={baseArticle} />);
    expect(
      screen.getByText('Bitcoin hit a new all-time high this week.')
    ).toBeInTheDocument();
  });

  it('hides description when showDescription=false', () => {
    render(<NewsCard article={baseArticle} showDescription={false} />);
    expect(
      screen.queryByText('Bitcoin hit a new all-time high this week.')
    ).not.toBeInTheDocument();
  });

  it('renders priority number in compact variant', () => {
    render(<NewsCard article={baseArticle} variant="compact" priority={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('links to the article slug URL', () => {
    render(<NewsCard article={baseArticle} />);
    const links = screen.getAllByRole('link');
    // At least one link should point to the mock slug
    const articleLink = links.find((l) => l.getAttribute('href')?.includes('mock-slug'));
    expect(articleLink).toBeDefined();
  });

  it('renders without optional props (minimal article)', () => {
    const minimalArticle = {
      title: 'Minimal Article',
      link: 'https://example.com/minimal',
      pubDate: '2026-02-21T00:00:00.000Z',
      source: 'Unknown',
      timeAgo: 'just now',
    };
    const { container } = render(<NewsCard article={minimalArticle} />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('Minimal Article')).toBeInTheDocument();
  });
});
