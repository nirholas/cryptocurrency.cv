/**
 * CardImage Component
 * Handles image display with lazy loading, gradient fallback, and loading states
 */

'use client';

import { useState } from 'react';
import { getSourceGradient } from './cardUtils';

interface CardImageProps {
  src?: string;
  alt: string;
  source: string;
  className?: string;
  /** Show the source initial as fallback */
  showSourceInitial?: boolean;
  /** Size variant affects the initial font size */
  size?: 'sm' | 'md' | 'lg';
}

export default function CardImage({ 
  src, 
  alt, 
  source, 
  className = '',
  showSourceInitial = true,
  size = 'md'
}: CardImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const gradient = getSourceGradient(source);

  const initialSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  const showGradientFallback = !src || hasError || !isLoaded;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Gradient background (always present as base/fallback) */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-300 ${
          isLoaded && src && !hasError ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4zIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWMTJoMnY0em0wLTZoLTJWNmgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat" />
        </div>
        
        {/* Source initial */}
        {showSourceInitial && showGradientFallback && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-white/80 font-bold tracking-tight ${initialSizes[size]}`}>
              {source.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Actual image with lazy loading */}
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Loading shimmer overlay */}
      {src && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}
    </div>
  );
}
