/**
 * Footer Component
 * Premium footer with gradient mesh background
 */

'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { categories } from '@/lib/categories';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');

  return (
    <footer className="relative bg-gray-900 text-white mt-16 overflow-hidden" role="contentinfo">
      {/* Animated gradient mesh background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 10% 90%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 10%, rgba(251, 191, 36, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(217, 119, 6, 0.15) 0%, transparent 60%)
          `
        }}
        aria-hidden="true"
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] bg-[length:60px_60px]"
        style={{
          backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `
        }}
        aria-hidden="true"
      />
      
      {/* Gradient divider with glow */}
      <div className="relative">
        <div className="h-1.5 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-300" aria-hidden="true" />
        <div className="absolute inset-0 h-1.5 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-300 blur-sm" aria-hidden="true" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 text-2xl font-black mb-6 focus-ring rounded group">
              <span aria-hidden="true" className="text-3xl">📰</span>
              <span className="bg-gradient-to-r from-gray-300 via-gray-200 to-white bg-clip-text text-transparent group-hover:from-white group-hover:to-gray-200 transition-all duration-300">
                {tCommon('appName')}
              </span>
            </Link>
            <p className="text-gray-400 text-base mb-8 leading-relaxed max-w-sm">
              {tCommon('tagline')}. {t('disclaimer')}
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://github.com/nirholas/free-crypto-news"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 bg-gray-800/80 rounded-xl hover:bg-brand-500 hover:scale-110 active:scale-95 transition-all duration-300 focus-ring border border-gray-700/50 hover:border-brand-400"
                aria-label="View on GitHub"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Categories */}
          <nav aria-label="Categories">
            <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-gradient-to-r from-brand-500 to-transparent" aria-hidden="true" />
              Categories
            </h3>
            <ul className="space-y-3">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.slug}>
                  <Link 
                    href={'/category/' + cat.slug} 
                    className="group text-gray-400 hover:text-white transition-colors inline-flex items-center gap-3 focus-ring rounded px-1 -mx-1"
                  >
                    <span aria-hidden="true" className="text-lg group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources">
            <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-gradient-to-r from-brand-500 to-transparent" aria-hidden="true" />
              Resources
            </h3>
            <ul className="space-y-3">
              {[
                { href: '/markets', icon: '📈', label: 'Markets' },
                { href: '/defi', icon: '🏦', label: 'DeFi Dashboard' },
                { href: '/orderbook', icon: '📗', label: 'Order Book' },
                { href: '/whales', icon: '🐋', label: 'Whale Alerts' },
                { href: '/portfolio', icon: '💼', label: 'Portfolio' },
                { href: '/ai/oracle', icon: '🔮', label: 'AI Oracle' },
              ].map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="group text-gray-400 hover:text-white transition-colors inline-flex items-center gap-3 focus-ring rounded px-1 -mx-1"
                  >
                    <span aria-hidden="true" className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Tools & Features */}
          <nav aria-label="Tools">
            <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-gradient-to-r from-brand-500 to-transparent" aria-hidden="true" />
              Tools & API
            </h3>
            <ul className="space-y-3">
              {[
                { href: '/developers', icon: '👨‍💻', label: 'Developer Portal' },
                { href: '/pricing', icon: '💰', label: 'API Pricing' },
                { href: '/pricing/upgrade', icon: '💳', label: 'Pay with Crypto' },
                { href: '/billing', icon: '📊', label: 'Billing' },
                { href: '/bookmarks', icon: '🔖', label: 'Bookmarks' },
                { href: '/install', icon: '📲', label: 'Install App' },
              ].map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="group text-gray-400 hover:text-white transition-colors inline-flex items-center gap-3 focus-ring rounded px-1 -mx-1"
                  >
                    <span aria-hidden="true" className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Additional Links Row */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-400">
            <Link href="/status" className="hover:text-white transition-colors">🟢 Status</Link>
            <Link href="/sources" className="hover:text-white transition-colors">📚 Sources</Link>
            <Link href="/topics" className="hover:text-white transition-colors">🏷️ Topics</Link>
            <Link href="/trending" className="hover:text-white transition-colors">🔥 Trending</Link>
            <Link href="/markets/gainers" className="hover:text-white transition-colors">📈 Gainers</Link>
            <Link href="/markets/losers" className="hover:text-white transition-colors">📉 Losers</Link>
            <Link href="/sentiment" className="hover:text-white transition-colors">😱 Fear & Greed</Link>
            <Link href="/arbitrage" className="hover:text-white transition-colors">🔄 Arbitrage</Link>
            <Link href="/predictions" className="hover:text-white transition-colors">🎯 Predictions</Link>
            <Link href="/watchlist" className="hover:text-white transition-colors">👁️ Watchlist</Link>
            <Link href="/settings" className="hover:text-white transition-colors">⚙️ Settings</Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800/50 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-brand-500/10 text-brand-400 px-3 py-1 rounded-full text-xs font-semibold">
              MIT Licensed
            </span>
            <span>•</span>
            <span>Made with 💛 by{' '}
              <a 
                href="https://github.com/nirholas" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors focus-ring rounded font-medium"
              >
                nich
              </a>
            </span>
          </p>
          <p className="text-center md:text-right text-gray-600 text-sm">
            Data from CoinDesk, The Block, Decrypt & more
          </p>
        </div>
      </div>
    </footer>
  );
}
