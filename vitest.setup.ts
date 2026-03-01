/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
  useMessages: () => ({}),
  useFormatter: () => ({
    dateTime: (date: Date) => date.toISOString(),
    number: (num: number) => String(num),
    relativeTime: () => 'just now',
  }),
  useNow: () => new Date(),
  useTimeZone: () => 'UTC',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next-intl/navigation
vi.mock('next-intl/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => 
    React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return React.createElement('a', { href, ...props }, children);
  },
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    return React.createElement('img', { src, alt, ...props });
  },
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock fetch
global.fetch = vi.fn();

// Mock scrollBy and scrollTo — jsdom does not implement layout-based scrolling
if (typeof Element !== 'undefined') {
  Element.prototype.scrollBy = vi.fn();
  Element.prototype.scrollTo = vi.fn();
}
if (typeof window !== 'undefined') {
  window.scrollBy = vi.fn() as unknown as typeof window.scrollBy;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
}

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

