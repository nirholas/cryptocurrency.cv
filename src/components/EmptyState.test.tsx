/**
 * @fileoverview Unit tests for EmptyState and related components
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Must be before component import
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  getPathname: () => '/',
}));

import EmptyState, {
  SearchEmptyState,
  BookmarksEmptyState,
  OfflineEmptyState,
  ErrorEmptyState,
  LoadingState,
} from './EmptyState';

describe('EmptyState', () => {
  it('renders default variant with default title and icon', () => {
    render(<EmptyState />);
    expect(screen.getByText('No content yet')).toBeInTheDocument();
    expect(screen.getByText(/nothing to show/i)).toBeInTheDocument();
  });

  it('renders search variant with correct text', () => {
    render(<EmptyState variant="search" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders bookmarks variant with correct text', () => {
    render(<EmptyState variant="bookmarks" />);
    expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
  });

  it('renders error variant with correct text', () => {
    render(<EmptyState variant="error" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders offline variant with correct text', () => {
    render(<EmptyState variant="offline" />);
    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('renders loading variant with correct text', () => {
    render(<EmptyState variant="loading" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom title overriding variant default', () => {
    render(<EmptyState variant="search" title="Custom title" />);
    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('renders custom description', () => {
    render(<EmptyState description="Custom description text" />);
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('renders primary action button with onClick handler', () => {
    const mockClick = vi.fn();
    render(<EmptyState action={{ label: 'Try again', onClick: mockClick }} />);
    const button = screen.getByRole('button', { name: 'Try again' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('renders primary action as link when href provided', () => {
    render(<EmptyState action={{ label: 'Go home', href: '/' }} />);
    const link = screen.getByRole('link', { name: 'Go home' });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/');
  });

  it('renders secondary action when provided', () => {
    render(
      <EmptyState
        action={{ label: 'Primary', onClick: vi.fn() }}
        secondaryAction={{ label: 'Secondary', href: '/secondary' }}
      />
    );
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Secondary' })).toBeInTheDocument();
  });

  it('renders custom icon as ReactNode', () => {
    render(<EmptyState icon={<span data-testid="custom-icon">🚀</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('applies compact class when compact=true', () => {
    const { container } = render(<EmptyState compact />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('py-8');
  });

  it('applies full padding class without compact', () => {
    const { container } = render(<EmptyState />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('py-16');
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState className="my-custom" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom');
  });
});

describe('SearchEmptyState', () => {
  it('renders with query in title', () => {
    render(<SearchEmptyState query="bitcoin" />);
    expect(screen.getByText('No results for "bitcoin"')).toBeInTheDocument();
  });

  it('renders generic title without query', () => {
    render(<SearchEmptyState />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders Clear search button when onClear is provided', () => {
    const mockClear = vi.fn();
    render(<SearchEmptyState onClear={mockClear} />);
    const button = screen.getByRole('button', { name: 'Clear search' });
    fireEvent.click(button);
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  it('renders Browse all news link', () => {
    render(<SearchEmptyState />);
    const link = screen.getByRole('link', { name: 'Browse all news' });
    expect(link.getAttribute('href')).toBe('/');
  });
});

describe('BookmarksEmptyState', () => {
  it('renders no bookmarks message', () => {
    render(<BookmarksEmptyState />);
    expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
  });

  it('renders Explore trending link', () => {
    render(<BookmarksEmptyState />);
    const link = screen.getByRole('link', { name: 'Explore trending' });
    expect(link.getAttribute('href')).toBe('/trending');
  });
});

describe('OfflineEmptyState', () => {
  it('renders offline message', () => {
    render(<OfflineEmptyState />);
    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('renders Try again button when onRetry provided', () => {
    const mockRetry = vi.fn();
    render(<OfflineEmptyState onRetry={mockRetry} />);
    const button = screen.getByRole('button', { name: 'Try again' });
    fireEvent.click(button);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorEmptyState', () => {
  it('renders error message', () => {
    render(<ErrorEmptyState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders Go home link', () => {
    render(<ErrorEmptyState />);
    const link = screen.getByRole('link', { name: 'Go home' });
    expect(link.getAttribute('href')).toBe('/');
  });

  it('renders Try again button when onRetry provided', () => {
    const mockRetry = vi.fn();
    render(<ErrorEmptyState onRetry={mockRetry} />);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('LoadingState', () => {
  it('renders loading heading', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom message when provided', () => {
    render(<LoadingState message="Fetching news data..." />);
    expect(screen.getByText('Fetching news data...')).toBeInTheDocument();
  });

  it('renders spinner element', () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
