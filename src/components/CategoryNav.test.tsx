/**
 * @fileoverview Unit tests for CategoryNav component
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Must be before component import
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => React.createElement('a', { href, ...props }, children),
}));

import CategoryNav from './CategoryNav';

describe('CategoryNav', () => {
  it('renders a navigation element with aria-label', () => {
    render(<CategoryNav />);
    expect(screen.getByRole('navigation', { name: 'News categories' })).toBeInTheDocument();
  });

  it('renders all 9 category links', () => {
    render(<CategoryNav />);
    const tablist = screen.getByRole('tablist', { name: 'Filter by category' });
    const tabs = tablist.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(9);
  });

  it('renders "All News" as first category', () => {
    render(<CategoryNav />);
    expect(screen.getByText('All News')).toBeInTheDocument();
  });

  it('renders category labels: Bitcoin, Ethereum, DeFi', () => {
    render(<CategoryNav />);
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('DeFi')).toBeInTheDocument();
  });

  it('renders category labels: NFTs, Regulation, Markets, Analysis', () => {
    render(<CategoryNav />);
    expect(screen.getByText('NFTs')).toBeInTheDocument();
    expect(screen.getByText('Regulation')).toBeInTheDocument();
    expect(screen.getByText('Markets')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
  });

  it('"All News" link points to /', () => {
    render(<CategoryNav />);
    const allNewsLink = screen.getByRole('link', { name: /All News/ });
    expect(allNewsLink.getAttribute('href')).toBe('/');
  });

  it('Bitcoin link points to /category/bitcoin', () => {
    render(<CategoryNav />);
    const bitcoinLink = screen.getByRole('link', { name: /Bitcoin/ });
    expect(bitcoinLink.getAttribute('href')).toBe('/category/bitcoin');
  });

  it('DeFi link points to /category/defi', () => {
    render(<CategoryNav />);
    const defiLink = screen.getByRole('link', { name: /DeFi/ });
    expect(defiLink.getAttribute('href')).toBe('/category/defi');
  });

  it('marks "All News" as active when activeCategory is empty (default)', () => {
    render(<CategoryNav activeCategory="" />);
    const allNewsTab = screen.getByRole('tab', { name: /All News/ });
    expect(allNewsTab.getAttribute('aria-current')).toBe('page');
    expect(allNewsTab.getAttribute('aria-selected')).toBe('true');
  });

  it('marks "Bitcoin" as active when activeCategory="bitcoin"', () => {
    render(<CategoryNav activeCategory="bitcoin" />);
    const bitcoinTab = screen.getByRole('tab', { name: /Bitcoin/ });
    expect(bitcoinTab.getAttribute('aria-current')).toBe('page');
    expect(bitcoinTab.getAttribute('aria-selected')).toBe('true');
  });

  it('does not mark "All News" as active when a category is selected', () => {
    render(<CategoryNav activeCategory="bitcoin" />);
    const allNewsTab = screen.getByRole('tab', { name: /All News/ });
    expect(allNewsTab.getAttribute('aria-current')).toBeNull();
    expect(allNewsTab.getAttribute('aria-selected')).toBe('false');
  });

  it('renders screen-reader "(current)" hint for active category', () => {
    render(<CategoryNav activeCategory="defi" />);
    expect(screen.getByText('(current)')).toBeInTheDocument();
  });
});
