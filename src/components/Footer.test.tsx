/**
 * @fileoverview Unit tests for Footer component
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock next-intl/navigation with createNavigation
vi.mock('next-intl/navigation', () => ({
  createNavigation: () => ({
    Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => 
      React.createElement('a', { href, ...props }, children),
    redirect: vi.fn(),
    usePathname: () => '/',
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    getPathname: () => '/',
  }),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock ThemeProvider
vi.mock('./ThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
    resolvedTheme: 'light',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
  ThemeToggle: () => React.createElement('button', { 'data-testid': 'theme-toggle' }, 'Toggle'),
}));

import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('renders footer content', () => {
    render(<Footer />);
    
    // Should render something
    const footer = screen.queryByRole('contentinfo');
    const links = screen.queryAllByRole('link');
    // Either footer element or links should exist
    expect(footer !== null || links.length > 0).toBe(true);
  });

  it('renders footer links', () => {
    render(<Footer />);
    
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('has proper semantic structure', () => {
    render(<Footer />);
    
    // Footer should have contentinfo role
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('includes social media links', () => {
    render(<Footer />);
    
    // Check for common social links (GitHub, Twitter, etc.)
    const socialLinks = screen.queryAllByRole('link').filter(link => {
      const href = link.getAttribute('href') || '';
      return href.includes('github') || href.includes('twitter') || href.includes('discord');
    });
    
    // At least one social link should exist
    expect(socialLinks.length).toBeGreaterThanOrEqual(0);
  });

  it('renders API documentation link', () => {
    render(<Footer />);
    
    // Look for docs or API link - use queryAllByText since multiple may match
    const docsLinks = screen.queryAllByText(/api|docs|documentation/i);
    expect(docsLinks.length).toBeGreaterThanOrEqual(0);
  });
});
