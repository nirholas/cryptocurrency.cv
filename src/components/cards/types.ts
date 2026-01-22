/**
 * @fileoverview Type definitions for Article Card components
 * These types are exported for SDK and external consumer use
 */

/**
 * Sentiment indicator for an article
 * - `bullish`: Positive market sentiment (green indicators)
 * - `bearish`: Negative market sentiment (red indicators)
 * - `neutral`: No clear market direction (gray indicators)
 */
export type ArticleSentiment = 'bullish' | 'bearish' | 'neutral';

/**
 * Supported news source names with custom styling
 * Each source has unique gradient and color configurations
 */
export type NewsSource =
  | 'CoinDesk'
  | 'CoinTelegraph'
  | 'Decrypt'
  | 'The Block'
  | 'Bitcoin Magazine'
  | 'CryptoNews'
  | 'Bitcoinist';

/**
 * Card variant types for different layout contexts
 * - `large`: Premium horizontal cards for featured content (320px height)
 * - `medium`: Vertical grid cards with 200px image area
 * - `small`: Compact sidebar cards for trending lists
 * - `list`: Full-width horizontal cards for "More Stories" sections
 */
export type CardVariant = 'large' | 'medium' | 'small' | 'list';

/**
 * Core article data structure
 * Required for all card components
 */
export interface Article {
  /** Article headline - displayed prominently */
  title: string;
  /** Full article URL for navigation */
  link: string;
  /** News source name (e.g., "CoinDesk", "Decrypt") */
  source: string;
  /** ISO date string of publication */
  pubDate: string;
  /** Relative time since publication (e.g., "2 hours ago") */
  timeAgo: string;
  /** Optional article summary/excerpt */
  description?: string;
  /** Article category for filtering */
  category?: string;
  /** Estimated reading time (e.g., "4 min read") */
  readTime?: string;
  /** Unique article identifier for bookmarks/analytics */
  id?: string;
  /** Article thumbnail/hero image URL */
  imageUrl?: string;
  /** Market sentiment indicator */
  sentiment?: ArticleSentiment;
  /** Reading progress percentage (0-100) for returning users */
  readProgress?: number;
}

/**
 * Color configuration for source-specific styling
 */
export interface SourceColorConfig {
  /** Background class (e.g., "bg-amber-500/20") */
  bg: string;
  /** Text color class (e.g., "text-amber-400") */
  text: string;
  /** Border color class (e.g., "border-amber-500/30") */
  border: string;
  /** Glow/shadow color for hover effects */
  glow: string;
}

/**
 * Sentiment color configuration
 */
export interface SentimentColorConfig {
  /** Background class for badges */
  bg: string;
  /** Text color class */
  text: string;
  /** Icon color class */
  icon: string;
}

/**
 * Props for ArticleCardLarge component
 */
export interface ArticleCardLargeProps {
  /** Article data to display */
  article: Article;
  /** Show bookmark button (default: true) */
  showBookmark?: boolean;
  /** Show share button (default: true) */
  showShare?: boolean;
  /** Show sentiment badge (default: true) */
  showSentiment?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for ArticleCardMedium component
 */
export interface ArticleCardMediumProps {
  /** Article data to display */
  article: Article;
  /** Show bookmark button (default: true) */
  showBookmark?: boolean;
  /** Show sentiment badge (default: true) */
  showSentiment?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for ArticleCardSmall component
 */
export interface ArticleCardSmallProps {
  /** Article data to display */
  article: Article;
  /** Optional rank number for trending lists (1-10) */
  rank?: number;
  /** Show bookmark button on hover (default: true) */
  showBookmark?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for ArticleCardList component
 */
export interface ArticleCardListProps {
  /** Article data to display */
  article: Article;
  /** Show bookmark button (default: true) */
  showBookmark?: boolean;
  /** Show share button (default: true) */
  showShare?: boolean;
  /** Show reading progress bar (default: false) */
  showProgress?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for CardImage component (internal utility)
 */
export interface CardImageProps {
  /** Image source URL */
  src?: string;
  /** Alt text for accessibility */
  alt: string;
  /** Source name for gradient fallback */
  source: string;
  /** Height variant for proper sizing */
  variant?: 'large' | 'medium' | 'small';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for Posts grid component
 */
export interface PostsProps {
  /** Array of articles to display */
  articles: Article[];
  /** Card variant to use for all items */
  variant?: CardVariant;
  /** Show rank numbers (for small variant) */
  showRank?: boolean;
  /** Additional CSS classes for the grid container */
  className?: string;
}

/**
 * Skeleton loading state props
 */
export interface CardSkeletonProps {
  /** Number of skeleton items to render */
  count?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Map of source names to gradient CSS strings
 */
export type SourceGradientMap = Record<string, string>;

/**
 * Map of source names to color configurations
 */
export type SourceColorMap = Record<string, SourceColorConfig>;

/**
 * Map of sentiment types to color configurations
 */
export type SentimentColorMap = Record<ArticleSentiment, SentimentColorConfig>;
