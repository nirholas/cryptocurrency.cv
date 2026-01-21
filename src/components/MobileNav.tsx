'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { categories } from '@/lib/categories';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors focus-ring"
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
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Slide-in Menu */}
      <nav
        id="mobile-menu"
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Mobile navigation"
        role="dialog"
        aria-modal="true"
      >
        {/* Menu Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-lg bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
            Menu
          </span>
          <button
            onClick={closeMenu}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus-ring"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <NavLink href="/" onClick={closeMenu} icon="🏠">Home</NavLink>
            <NavLink href="/markets" onClick={closeMenu} icon="📈">Markets</NavLink>
            <NavLink href="/defi" onClick={closeMenu} icon="🏦">DeFi Dashboard</NavLink>
            <NavLink href="/trending" onClick={closeMenu} icon="🔥">Trending</NavLink>
            <NavLink href="/movers" onClick={closeMenu} icon="🚀">Top Movers</NavLink>
            <NavLink href="/sources" onClick={closeMenu} icon="📚">News Sources</NavLink>
            <NavLink href="/topics" onClick={closeMenu} icon="🏷️">Topics</NavLink>
            <NavLink href="/search" onClick={closeMenu} icon="🔍">Search</NavLink>
          </div>

          {/* Categories Section */}
          <div>
            <h2 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Categories
            </h2>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  onClick={closeMenu}
                  className="flex items-center gap-2 px-3 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors focus-ring text-sm"
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Resources Section */}
          <div>
            <h2 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Resources
            </h2>
            <div className="space-y-1 mt-2">
              <NavLink href="/examples" onClick={closeMenu} icon="💻">Code Examples</NavLink>
              <NavLink href="/about" onClick={closeMenu} icon="ℹ️">About</NavLink>
              <a
                href="https://github.com/nirholas/free-crypto-news"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors focus-ring"
              >
                <span className="text-lg" aria-hidden="true">⭐</span>
                <span className="font-medium">GitHub</span>
                <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* API CTA */}
          <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-2xl p-4 border border-brand-200/50">
            <h3 className="font-semibold text-brand-900 mb-1">Free Crypto API</h3>
            <p className="text-sm text-brand-700/80 mb-3">No keys required. Start building today.</p>
            <Link
              href="/about"
              onClick={closeMenu}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-800 active:scale-95 transition-all focus-ring"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, onClick, icon, children }: { 
  href: string; 
  onClick: () => void; 
  icon: string; 
  children: React.ReactNode 
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors focus-ring"
    >
      <span className="text-lg" aria-hidden="true">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}
