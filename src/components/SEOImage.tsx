/**
 * SEO-Optimized Image Component
 * Wrapper around next/image with SEO best practices
 */

'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface SEOImageProps extends Omit<ImageProps, 'alt'> {
  alt: string; // Make alt required
  fallbackSrc?: string;
  caption?: string;
  credit?: string;
}

/**
 * SEO-optimized image component
 * - Enforces alt text (required)
 * - Provides fallback for failed loads
 * - Includes optional caption/credit for news images
 * - Uses proper loading strategy
 */
export function SEOImage({
  alt,
  src,
  fallbackSrc = '/images/placeholder.svg',
  caption,
  credit,
  priority = false,
  loading,
  ...props
}: SEOImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  // Use priority for above-the-fold images, lazy for others
  const loadingStrategy = priority ? undefined : (loading || 'lazy');

  if (caption || credit) {
    return (
      <figure className="relative">
        <Image
          {...props}
          src={imgSrc}
          alt={alt}
          priority={priority}
          loading={loadingStrategy}
          onError={handleError}
        />
        {(caption || credit) && (
          <figcaption className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {caption}
            {credit && (
              <span className="text-gray-400 dark:text-gray-500">
                {caption ? ' — ' : ''}{credit}
              </span>
            )}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      priority={priority}
      loading={loadingStrategy}
      onError={handleError}
    />
  );
}

/**
 * Generate descriptive alt text for crypto-related images
 */
export function generateCryptoAltText({
  type,
  name,
  symbol,
  context,
}: {
  type: 'logo' | 'chart' | 'news' | 'person' | 'exchange';
  name: string;
  symbol?: string;
  context?: string;
}): string {
  const symbolStr = symbol ? ` (${symbol.toUpperCase()})` : '';
  
  switch (type) {
    case 'logo':
      return `${name}${symbolStr} cryptocurrency logo`;
    case 'chart':
      return `${name}${symbolStr} price chart${context ? ` - ${context}` : ''}`;
    case 'news':
      return context || `News article about ${name}${symbolStr}`;
    case 'person':
      return `${name}${context ? `, ${context}` : ''}`;
    case 'exchange':
      return `${name} cryptocurrency exchange logo`;
    default:
      return `${name}${symbolStr}`;
  }
}

/**
 * Open Graph image dimensions
 */
export const OG_IMAGE_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;

/**
 * Standard image sizes for responsive images
 */
export const IMAGE_SIZES = {
  thumbnail: '(max-width: 640px) 100vw, 128px',
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  hero: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw',
  full: '100vw',
} as const;
