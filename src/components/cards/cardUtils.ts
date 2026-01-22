/**
 * Shared utilities and types for article cards
 * Centralized source colors, gradients, and common functionality
 */

// Source-based gradient colors for image placeholders
export const sourceGradients: Record<string, string> = {
  'CoinDesk': 'from-blue-500 via-blue-600 to-blue-700',
  'The Block': 'from-purple-500 via-purple-600 to-purple-700',
  'Decrypt': 'from-emerald-500 via-emerald-600 to-emerald-700',
  'CoinTelegraph': 'from-orange-500 via-orange-600 to-orange-700',
  'Bitcoin Magazine': 'from-amber-500 via-amber-600 to-amber-700',
  'Blockworks': 'from-indigo-500 via-indigo-600 to-indigo-700',
  'The Defiant': 'from-pink-500 via-pink-600 to-pink-700',
};

export const sourceColors: Record<string, { bg: string; text: string; solid: string }> = {
  'CoinDesk': { 
    bg: 'bg-blue-100 dark:bg-blue-900/30', 
    text: 'text-blue-700 dark:text-blue-300',
    solid: 'bg-blue-500'
  },
  'The Block': { 
    bg: 'bg-purple-100 dark:bg-purple-900/30', 
    text: 'text-purple-700 dark:text-purple-300',
    solid: 'bg-purple-500'
  },
  'Decrypt': { 
    bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
    text: 'text-emerald-700 dark:text-emerald-300',
    solid: 'bg-emerald-500'
  },
  'CoinTelegraph': { 
    bg: 'bg-orange-100 dark:bg-orange-900/30', 
    text: 'text-orange-700 dark:text-orange-300',
    solid: 'bg-orange-500'
  },
  'Bitcoin Magazine': { 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-300',
    solid: 'bg-amber-500'
  },
  'Blockworks': { 
    bg: 'bg-indigo-100 dark:bg-indigo-900/30', 
    text: 'text-indigo-700 dark:text-indigo-300',
    solid: 'bg-indigo-500'
  },
  'The Defiant': { 
    bg: 'bg-pink-100 dark:bg-pink-900/30', 
    text: 'text-pink-700 dark:text-pink-300',
    solid: 'bg-pink-500'
  },
};

export const defaultGradient = 'from-gray-500 via-gray-600 to-gray-700';
export const defaultSourceStyle = { 
  bg: 'bg-gray-100 dark:bg-gray-800', 
  text: 'text-gray-700 dark:text-gray-300',
  solid: 'bg-gray-500'
};

// Sentiment badge colors
export const sentimentColors: Record<string, { bg: string; text: string; icon: string }> = {
  'bullish': { 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-700 dark:text-green-400',
    icon: '📈'
  },
  'bearish': { 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-700 dark:text-red-400',
    icon: '📉'
  },
  'neutral': { 
    bg: 'bg-gray-100 dark:bg-gray-800', 
    text: 'text-gray-600 dark:text-gray-400',
    icon: '➡️'
  },
};

// Common article interface
export interface Article {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  timeAgo: string;
  description?: string;
  category?: string;
  readTime?: string;
  id?: string;
  imageUrl?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  readProgress?: number; // 0-100 percentage
}

// Helper to get gradient for a source
export function getSourceGradient(source: string): string {
  return sourceGradients[source] || defaultGradient;
}

// Helper to get colors for a source
export function getSourceColors(source: string) {
  return sourceColors[source] || defaultSourceStyle;
}

// Estimate read time from description (rough estimate)
export function estimateReadTime(text?: string): string {
  if (!text) return '2 min read';
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
