/**
 * Resource Hints Component
 * Preload critical resources for better performance
 */

interface ResourceHintsProps {
  preconnect?: string[];
  dnsPrefetch?: string[];
  preload?: Array<{
    href: string;
    as: 'script' | 'style' | 'font' | 'image' | 'fetch';
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }>;
}

/**
 * Default external domains to preconnect to
 */
const DEFAULT_PRECONNECT = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

/**
 * Default domains for DNS prefetch
 */
const DEFAULT_DNS_PREFETCH = [
  'https://api.coingecko.com',
  'https://assets.coingecko.com',
  'https://coin-images.coingecko.com',
  'https://api.llama.fi',
];

/**
 * Resource Hints for optimal loading performance
 * Place in the <head> via layout.tsx
 */
export function ResourceHints({
  preconnect = DEFAULT_PRECONNECT,
  dnsPrefetch = DEFAULT_DNS_PREFETCH,
  preload = [],
}: ResourceHintsProps) {
  return (
    <>
      {/* Preconnect - establish early connections to important origins */}
      {preconnect.map((href) => (
        <link
          key={`preconnect-${href}`}
          rel="preconnect"
          href={href}
        />
      ))}
      
      {/* DNS Prefetch - resolve DNS early for domains we'll use soon */}
      {dnsPrefetch.map((href) => (
        <link
          key={`dns-prefetch-${href}`}
          rel="dns-prefetch"
          href={href}
        />
      ))}
      
      {/* Preload - fetch critical resources early */}
      {preload.map((resource) => (
        <link
          key={`preload-${resource.href}`}
          rel="preload"
          href={resource.href}
          as={resource.as}
          type={resource.type}
        />
      ))}
    </>
  );
}

/**
 * Critical CSS inline component
 * Inlines critical CSS to prevent render blocking
 */
export function CriticalCSS({ css }: { css: string }) {
  return (
    <style
      dangerouslySetInnerHTML={{ __html: css }}
      data-critical="true"
    />
  );
}

/**
 * Generate preload link for LCP image
 * Use for hero/above-the-fold images
 */
export function PreloadLCPImage({ 
  src, 
  srcSet,
  sizes,
}: { 
  src: string;
  srcSet?: string;
  sizes?: string;
}) {
  return (
    <link
      rel="preload"
      as="image"
      href={src}
    />
  );
}

/**
 * Module preload for critical JavaScript
 */
export function PreloadModule({ href }: { href: string }) {
  return (
    <link
      rel="modulepreload"
      href={href}
    />
  );
}
