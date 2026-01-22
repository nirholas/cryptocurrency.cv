'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { categories } from '@/lib/categories';

// Navigation sections for mobile
const mainNavItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/markets', label: 'Markets', icon: '📈' },
  { href: '/defi', label: 'DeFi Dashboard', icon: '🏦' },
  { href: '/trending', label: 'Trending', icon: '🔥' },
  { href: '/movers', label: 'Top Movers', icon: '🚀' },
  { href: '/sources', label: 'News Sources', icon: '📚' },
  { href: '/topics', label: 'Topics', icon: '🏷️' },
  { href: '/search', label: 'Search', icon: '🔍' },
];

const resourceLinks = [
  { href: '/examples', label: 'Code Examples', icon: '💻' },
  { href: '/about', label: 'About', icon: 'ℹ️' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  // Close menu on escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      openButtonRef.current?.focus();
    }
  }, []);

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      // Focus the close button when menu opens
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleEscape, handleClickOutside]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    openButtonRef.current?.focus();
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="lg:hidden">
      {/* Menu Button */}
      <button
        ref={openButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-ring"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
        <svg 
          className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Slide-in Menu */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className={`fixed top-0 right-0 h-full w-full sm:w-96 sm:max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Menu Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden="true">📰</span>
            <span className="font-bold text-lg bg-gradient-to-r from-brand-600 to-brand-500 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent">
              Crypto News
            </span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={closeMenu}
            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-ring"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <nav className="flex-1 overflow-y-auto overscroll-contain" aria-label="Mobile navigation">
          <div className="px-4 py-6 space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3.5 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors focus-ring"
                >
                  <span className="text-xl w-7 text-center" aria-hidden="true">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Categories Section - Collapsible */}
            <div>
              <button
                onClick={() => toggleSection('categories')}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-slate-400 transition-colors focus-ring rounded-lg"
                aria-expanded={expandedSection === 'categories'}
              >
                <span>Categories</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${expandedSection === 'categories' ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div 
                className={`grid grid-cols-2 gap-1 mt-2 overflow-hidden transition-all duration-300 ${
                  expandedSection === 'categories' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    onClick={closeMenu}
                    className="flex items-center gap-2.5 px-3 py-3 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors focus-ring text-sm"
                  >
                    <span className="text-base" aria-hidden="true">{cat.icon}</span>
                    <span className="font-medium">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources Section - Collapsible */}
            <div>
              <button
                onClick={() => toggleSection('resources')}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-slate-400 transition-colors focus-ring rounded-lg"
                aria-expanded={expandedSection === 'resources'}
              >
                <span>Resources</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${expandedSection === 'resources' ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div 
                className={`space-y-1 mt-2 overflow-hidden transition-all duration-300 ${
                  expandedSection === 'resources' ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {resourceLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors focus-ring"
                  >
                    <span className="text-lg" aria-hidden="true">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                <a
                  href="https://github.com/nirholas/free-crypto-news"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors focus-ring"
                >
                  <span className="text-lg" aria-hidden="true">⭐</span>
                  <span className="font-medium">GitHub</span>
                  <svg className="w-4 h-4 ml-auto text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 p-4">
          <div className="bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 rounded-2xl p-4 border border-brand-200/50 dark:border-brand-700/50">
            <h3 className="font-semibold text-brand-900 dark:text-brand-100 mb-1">Free Crypto API</h3>
            <p className="text-sm text-brand-700/80 dark:text-brand-300/80 mb-3">No keys required. Start building today.</p>
            <Link
              href="/about"
              onClick={closeMenu}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 dark:bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-800 dark:hover:bg-brand-500 active:scale-95 transition-all focus-ring shadow-md hover:shadow-lg"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
