/**
 * SentimentBadge Component
 * Displays bullish/bearish/neutral sentiment indicator
 */

import { sentimentColors } from './cardUtils';

interface SentimentBadgeProps {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  size?: 'sm' | 'md';
}

export default function SentimentBadge({ sentiment, size = 'sm' }: SentimentBadgeProps) {
  const colors = sentimentColors[sentiment];
  
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-sm px-2.5 py-1 gap-1.5';

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses}`}
      title={`Market sentiment: ${sentiment}`}
    >
      <span aria-hidden="true">{colors.icon}</span>
      <span className="capitalize">{sentiment}</span>
    </span>
  );
}
