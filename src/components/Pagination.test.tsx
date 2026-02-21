/**
 * @fileoverview Unit tests for Pagination component
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Must be before component import
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  getPathname: () => '/',
}));

import Pagination from './Pagination';

describe('Pagination', () => {
  const basePath = '/news';

  it('returns null when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} basePath={basePath} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when totalPages is 0', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} basePath={basePath} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a nav element with aria-label Pagination', () => {
    render(<Pagination currentPage={1} totalPages={5} basePath={basePath} />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(nav).toBeInTheDocument();
  });

  it('renders "Previous page" link when not on first page', () => {
    render(<Pagination currentPage={2} totalPages={5} basePath={basePath} />);
    expect(screen.getByRole('link', { name: 'Previous page' })).toBeInTheDocument();
  });

  it('does not render a "Previous page" link on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} basePath={basePath} />);
    expect(screen.queryByRole('link', { name: 'Previous page' })).not.toBeInTheDocument();
  });

  it('renders "Next page" link when not on last page', () => {
    render(<Pagination currentPage={2} totalPages={5} basePath={basePath} />);
    expect(screen.getByRole('link', { name: 'Next page' })).toBeInTheDocument();
  });

  it('does not render a "Next page" link on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} basePath={basePath} />);
    expect(screen.queryByRole('link', { name: 'Next page' })).not.toBeInTheDocument();
  });

  it('marks the current page with aria-current="page"', () => {
    render(<Pagination currentPage={3} totalPages={5} basePath={basePath} />);
    const currentPageLink = screen.getByRole('link', { current: 'page' });
    expect(currentPageLink).toHaveTextContent('3');
  });

  it('renders all page numbers when totalPages <= 7', () => {
    render(<Pagination currentPage={1} totalPages={5} basePath={basePath} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('link', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('generates correct URL for page 1 (no query param)', () => {
    render(<Pagination currentPage={2} totalPages={5} basePath={basePath} />);
    const prevLink = screen.getByRole('link', { name: 'Previous page' });
    expect(prevLink.getAttribute('href')).toBe('/news');
  });

  it('generates correct URL for page 2+', () => {
    render(<Pagination currentPage={1} totalPages={5} basePath={basePath} />);
    const nextLink = screen.getByRole('link', { name: 'Next page' });
    expect(nextLink.getAttribute('href')).toBe('/news?page=2');
  });

  it('shows ellipsis for large page counts when current page is near middle', () => {
    render(<Pagination currentPage={5} totalPages={20} basePath={basePath} />);
    const ellipsisElements = screen.getAllByText('...');
    expect(ellipsisElements.length).toBeGreaterThanOrEqual(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={5} basePath={basePath} className="my-custom-class" />
    );
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('my-custom-class');
  });

  it('has prev link pointing to page 2 when on page 3', () => {
    render(<Pagination currentPage={3} totalPages={10} basePath={basePath} />);
    const prevLink = screen.getByRole('link', { name: 'Previous page' });
    expect(prevLink.getAttribute('href')).toBe('/news?page=2');
  });

  it('has next link pointing to page 4 when on page 3', () => {
    render(<Pagination currentPage={3} totalPages={10} basePath={basePath} />);
    const nextLink = screen.getByRole('link', { name: 'Next page' });
    expect(nextLink.getAttribute('href')).toBe('/news?page=4');
  });
});
