/**
 * CoinHeader Component - Displays coin logo, name, rank, and action buttons
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinHeaderProps {
  coin: {
    id: string;
    name: string;
    symbol: string;
    image: {
      large?: string;
      small?: string;
      thumb?: string;
    };
    market_cap_rank: number | null;
    categories?: string[];
  };
  onWatchlistToggle?: () => void;
  onAlertClick?: () => void;
  isWatchlisted?: boolean;
}

export default function CoinHeader({
  coin,
  onWatchlistToggle,
  onAlertClick,
  isWatchlisted = false,
}: CoinHeaderProps) {
  const [showCopied, setShowCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${coin.name} (${coin.symbol.toUpperCase()}) - Price & Market Data`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const imageUrl = coin.image?.large || coin.image?.small || coin.image?.thumb;
  const displayCategories = coin.categories?.slice(0, 3) || [];

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span className="text-gray-600">/</span>
        <Link href="/markets" className="hover:text-white transition-colors">
          Coins
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-white">{coin.name}</span>
      </nav>

      {/* Main header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Coin Logo */}
          <div className="relative">
            {imageUrl && !imgError ? (
              <img
                src={imageUrl}
                alt={coin.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-2 ring-gray-700"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl font-bold text-gray-900 ring-2 ring-gray-700">
                {coin.symbol.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and symbol */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {coin.name}
              </h1>
              <span className="text-lg text-gray-400 font-medium">
                {coin.symbol.toUpperCase()}
              </span>
              {coin.market_cap_rank && (
                <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-md">
                  Rank #{coin.market_cap_rank}
                </span>
              )}
            </div>

            {/* Categories */}
            {displayCategories.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {displayCategories.map((category) => (
                  <Link
                    key={category}
                    href={`/category/${encodeURIComponent(category.toLowerCase().replace(/\s+/g, '-'))}`}
                    className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs rounded-md transition-colors"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Watchlist button */}
          <motion.button
            onClick={onWatchlistToggle}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              isWatchlisted
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600'
            }`}
          >
            <motion.svg
              animate={{ scale: isWatchlisted ? [1, 1.2, 1] : 1 }}
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill={isWatchlisted ? 'currentColor' : 'none'}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={isWatchlisted ? 0 : 1.5}
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </motion.svg>
            <span className="hidden sm:inline">
              {isWatchlisted ? 'Watching' : 'Watchlist'}
            </span>
          </motion.button>

          {/* Price alert button */}
          <button
            onClick={onAlertClick}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg font-medium text-sm border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="hidden sm:inline">Alert</span>
          </button>

          {/* Share button */}
          <div className="relative">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg font-medium text-sm border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Copied tooltip */}
            <AnimatePresence>
              {showCopied && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-700 text-white text-xs rounded whitespace-nowrap"
                >
                  Link copied!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
