/**
 * Article Card Components
 * 
 * Export all card variants and utilities for easy importing:
 * 
 * Main Cards:
 * import { ArticleCardLarge, ArticleCardMedium, ArticleCardSmall, ArticleCardList } from '@/components/cards';
 * 
 * Skeletons:
 * import { ArticleCardLargeSkeleton, ArticleGridSkeleton } from '@/components/cards';
 * 
 * Utilities:
 * import { CardImage, CardBookmarkButton, SentimentBadge } from '@/components/cards';
 */

// Main card components
export { default as ArticleCardLarge } from './ArticleCardLarge';
export { default as ArticleCardMedium } from './ArticleCardMedium';
export { default as ArticleCardSmall } from './ArticleCardSmall';
export { default as ArticleCardList } from './ArticleCardList';

// Utility components
export { default as CardImage } from './CardImage';
export { default as CardBookmarkButton } from './CardBookmarkButton';
export { default as QuickShareButton } from './QuickShareButton';
export { default as SentimentBadge } from './SentimentBadge';
export { default as ReadingProgress } from './ReadingProgress';

// Skeleton loading states
export { 
  ArticleCardLargeSkeleton,
  ArticleCardMediumSkeleton,
  ArticleCardSmallSkeleton,
  ArticleCardListSkeleton,
  ArticleGridSkeleton
} from './CardSkeletons';

// Re-export skeleton components with shorter aliases
export {
  ArticleCardLargeSkeleton as CardSkeletonLarge,
  ArticleCardMediumSkeleton as CardSkeletonMedium,
  ArticleCardSmallSkeleton as CardSkeletonSmall,
  ArticleCardListSkeleton as CardSkeletonList,
} from './CardSkeletons';

// Utilities and types from cardUtils
export { 
  sourceGradients,
  sourceColors,
  sentimentColors,
  getSourceGradient,
  getSourceColors,
  estimateReadTime,
  type Article
} from './cardUtils';

// Type definitions for SDK/external use
export type {
  ArticleSentiment,
  NewsSource,
  CardVariant,
  SourceColorConfig,
  SentimentColorConfig,
  ArticleCardLargeProps,
  ArticleCardMediumProps,
  ArticleCardSmallProps,
  ArticleCardListProps,
  CardImageProps,
  PostsProps,
  CardSkeletonProps,
  SourceGradientMap,
  SourceColorMap,
  SentimentColorMap,
} from './types';
