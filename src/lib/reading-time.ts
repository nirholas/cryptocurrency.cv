/**
 * @fileoverview Reading Time Calculator Utilities
 * 
 * Functions for calculating and estimating article reading times.
 * Uses industry-standard 200 WPM average adult reading speed.
 * 
 * @module lib/reading-time
 * 
 * @example
 * import { calculateReadingTime, estimateReadingTime, getReadingTimeBadgeColor } from '@/lib/reading-time';
 * 
 * // From full article text
 * const fullTime = calculateReadingTime(articleContent);
 * console.log(fullTime.text); // "5 min read"
 * 
 * // Estimate from metadata only
 * const estimated = estimateReadingTime(title, description);
 * console.log(estimated.text); // "~3 min read"
 * 
 * // Get badge styling
 * const colorClass = getReadingTimeBadgeColor(5);
 * // "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
 */

/**
 * Average adult reading speed in words per minute.
 * Based on research showing most adults read 200-250 WPM.
 * @constant {number}
 */
const WORDS_PER_MINUTE = 200;

export interface ReadingTimeResult {
  minutes: number;
  text: string;
  words: number;
}

/**
 * Calculate reading time from text content
 */
export function calculateReadingTime(text: string): ReadingTimeResult {
  // Remove HTML tags if present
  const cleanText = text.replace(/<[^>]*>/g, '');
  
  // Count words (split by whitespace)
  const words = cleanText.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  // Calculate minutes
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  
  // Format text
  const text_formatted = minutes === 1 ? '1 min read' : `${minutes} min read`;
  
  return {
    minutes,
    text: text_formatted,
    words,
  };
}

/**
 * Estimate reading time from article title and description
 * Used when full content isn't available
 */
export function estimateReadingTime(title: string, description?: string): ReadingTimeResult {
  // For news articles without full content, estimate based on typical article length
  // Most crypto news articles are 300-800 words
  const titleWords = title.split(/\s+/).length;
  const descWords = description ? description.split(/\s+/).length : 0;
  
  // Estimate full article is roughly 10-15x the title + description length
  const estimatedWords = Math.max(300, (titleWords + descWords) * 12);
  
  const minutes = Math.max(2, Math.ceil(estimatedWords / WORDS_PER_MINUTE));
  
  return {
    minutes,
    text: `~${minutes} min read`,
    words: estimatedWords,
  };
}

/**
 * Get reading time badge color based on length
 */
export function getReadingTimeBadgeColor(minutes: number): string {
  if (minutes <= 2) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (minutes <= 5) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (minutes <= 10) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}
