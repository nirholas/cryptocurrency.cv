/**
 * Enhanced Header with Search
 * Full-featured navigation header
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HeaderNew() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">📰</span>
              <span className="font-bold text-xl hidden sm:inline">Crypto News</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-black transition font-medium">
                News
              </Link>
              <Link href="/markets" className="text-gray-600 hover:text-black transition font-medium">
                Markets
              </Link>
              <Link href="/category/bitcoin" className="text-gray-600 hover:text-black transition font-medium">
                Bitcoin
              </Link>
              <Link href="/category/defi" className="text-gray-600 hover:text-black transition font-medium">
                DeFi
              </Link>
              <Link href="/read" className="text-gray-600 hover:text-black transition font-medium">
                Reader
              </Link>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-600 hover:text-black transition"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* GitHub Link */}
            <a
              href="https://github.com/nirholas/free-crypto-news"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-full hover:bg-gray-50 transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span>Star</span>
            </a>

            {/* API Link */}
            <Link
              href="/api/news"
              className="hidden md:inline-flex bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition"
            >
              API
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-black transition"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar (Expandable) */}
        {searchOpen && (
          <div className="py-4 border-t">
            <form action="/search" className="flex gap-2">
              <input
                type="search"
                name="q"
                placeholder="Search news..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="submit"
                className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <nav className="flex flex-col gap-2">
              <Link href="/" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                News
              </Link>
              <Link href="/markets" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                Markets
              </Link>
              <Link href="/category/bitcoin" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                Bitcoin
              </Link>
              <Link href="/category/defi" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                DeFi
              </Link>
              <Link href="/read" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                Reader
              </Link>
              <Link href="/examples" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
                Examples
              </Link>
              <a
                href="https://github.com/nirholas/free-crypto-news"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
              >
                GitHub
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
