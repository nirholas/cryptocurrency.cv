"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string | undefined | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  /** Aspect ratio as "w/h", e.g. "16/10", "1/1". Defaults to "16/10". */
  aspectRatio?: string;
  /** Category name — used for fallback placeholder color */
  category?: string;
  /** Priority loading — skips lazy loading for above-the-fold images */
  priority?: boolean;
  /** Sizes hint for responsive images */
  sizes?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  bitcoin: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  ethereum: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  defi: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  altcoins: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
  nft: "bg-pink-500/20 text-pink-600 dark:text-pink-400",
  regulation: "bg-red-500/20 text-red-600 dark:text-red-400",
  markets: "bg-green-500/20 text-green-600 dark:text-green-400",
  technology: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  default: "bg-gray-500/10 text-gray-500 dark:text-gray-400",
};

function getCategoryColor(category?: string): string {
  if (!category) return CATEGORY_COLORS.default;
  const key = category.toLowerCase();
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.default;
}

function getCategoryIcon(category?: string): string {
  const icons: Record<string, string> = {
    bitcoin: "₿",
    ethereum: "Ξ",
    defi: "🔗",
    altcoins: "🪙",
    nft: "🎨",
    regulation: "⚖️",
    markets: "📊",
    technology: "⚙️",
  };
  if (!category) return "📰";
  return icons[category.toLowerCase()] ?? "📰";
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  aspectRatio = "16/10",
  category,
  priority = false,
  sizes,
}: OptimizedImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isVisible) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" } // Start loading 200px before viewport
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [priority, isVisible]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  const showFallback = hasError || !src;
  const colorClass = getCategoryColor(category);
  const icon = getCategoryIcon(category);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg bg-surface-secondary",
        containerClassName
      )}
      style={{ aspectRatio }}
    >
      {/* Shimmer placeholder - visible until image loads */}
      {!isLoaded && !showFallback && (
        <div className="absolute inset-0 skeleton" aria-hidden="true" />
      )}

      {/* Actual image */}
      {isVisible && !showFallback && (
        <img
          ref={imgRef}
          src={src!}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
        />
      )}

      {/* Fallback placeholder */}
      {showFallback && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1",
            colorClass
          )}
          aria-hidden="true"
        >
          <span className="text-2xl">{icon}</span>
          {category && (
            <span className="text-xs font-medium capitalize opacity-70">
              {category}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
