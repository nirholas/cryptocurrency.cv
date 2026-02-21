/**
 * @fileoverview Unit tests for BreakingNewsBanner component
 *
 * BreakingNewsBanner is a server component that accepts `articles` as props.
 * It renders a breaking news strip for the first article, or nothing when the
 * array is empty.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/archive-v2', () => ({
  generateArticleSlug: (title: string, _date: string) =>
    title.toLowerCase().replace(/\s+/g, '-'),
}));

import BreakingNewsBanner from './BreakingNewsBanner';
import type { NewsArticle } from '@/lib/crypto-news';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeArticle(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    title: 'Bitcoin ETF Approval Shakes Market',
    link: 'https://coindesk.com/bitcoin-etf',
    description: 'The SEC approved a Bitcoin spot ETF today.',
    pubDate: '2026-02-21T09:00:00.000Z',
    source: 'CoinDesk',
    sourceKey: 'coindesk',
    category: 'bitcoin',
    timeAgo: '1h ago',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BreakingNewsBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the breaking news headline when articles are provided', () => {
    render(<BreakingNewsBanner articles={[makeArticle()]} />);
    expect(
      screen.getByText('Bitcoin ETF Approval Shakes Market')
    ).toBeInTheDocument();
  });

  it('renders the "Breaking" badge', () => {
    render(<BreakingNewsBanner articles={[makeArticle()]} />);
    expect(screen.getByText(/breaking/i)).toBeInTheDocument();
  });

  it('renders nothing when articles array is empty', () => {
    const { container } = render(<BreakingNewsBanner articles={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('links to the internal article page using the slug', () => {
    const article = makeArticle({ title: 'Ethereum Upgrade Live' });
    render(<BreakingNewsBanner articles={[article]} />);

    // The link should contain the slug derived from the title
    const links = screen.getAllByRole('link');
    const articleLink = links.find((l) =>
      l.getAttribute('href')?.includes('ethereum-upgrade-live')
    );
    expect(articleLink).toBeDefined();
    expect(articleLink!.getAttribute('href')).toMatch(/\/article\//);
  });

  it('renders only the first article when multiple are provided', () => {
    const articles = [
      makeArticle({ title: 'First Article' }),
      makeArticle({ title: 'Second Article' }),
    ];
    render(<BreakingNewsBanner articles={articles} />);

    expect(screen.getByText('First Article')).toBeInTheDocument();
    expect(screen.queryByText('Second Article')).not.toBeInTheDocument();
  });

  it('renders the time indicator from the article', () => {
    render(<BreakingNewsBanner articles={[makeArticle({ timeAgo: '5m ago' })]} />);
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });
});
