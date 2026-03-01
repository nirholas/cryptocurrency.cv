/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output only for Docker builds; Vercel ignores it but it
  // increases build time and conflicts with edge routes.
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' } : {}),
  // Compress responses
  compress: true,
  
  // Security headers
  async headers() {
    return [
      {
        // Apply to all routes except /embed/*
        source: '/:path((?!embed).*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Changed from DENY to allow PWA features
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // CSP is set dynamically by middleware (nonce-based).
          // Do NOT add a static Content-Security-Policy header here — it
          // would conflict with the per-request nonce generated in middleware.ts.
        ],
      },
      {
        // Embed widgets — allow cross-origin iframing
        source: '/embed/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
        ],
      },
      // ================================================================
      // AI Discoverability — llms.txt, robots.txt, .well-known, ai.txt
      // ================================================================
      {
        source: '/llms.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/llms-full.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/ai.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/.well-known/:file*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        // Service Worker headers
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Manifest headers
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        // PWA assets headers
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Splash screen headers
        source: '/splash/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API routes - CORS and caching
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Public API — allow all origins including AI agents (GPTBot, ClaudeBot, etc.)
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
          {
            key: 'X-RateLimit-Policy',
            value: 'fair-use',
          },
        ],
      },
      {
        // Fallback static files — served when all upstreams are down
        source: '/fallback/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Type', value: 'application/json' },
          { key: 'X-Fallback', value: '1' },
        ],
      },
    ];
  },
  // ================================================================
  // Rewrites — /llms-full.txt → dynamic API route (static file fallback)
  // ================================================================
  async rewrites() {
    return {
      // beforeFiles: runs before Next.js checks public/ static files,
      // so the dynamic API route always wins over public/llms-full.txt.
      beforeFiles: [
        {
          source: '/llms-full.txt',
          destination: '/api/llms-full.txt',
        },
        {
          source: '/.well-known/agents.json',
          destination: '/api/well-known/agents',
        },
        {
          source: '/.well-known/ai-plugin.json',
          destination: '/api/well-known/ai-plugin',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      // Allow all HTTPS images — this aggregator pulls from 100+ RSS feed
      // domains whose image CDNs cannot be exhaustively enumerated.
      { protocol: 'https', hostname: '**' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  
  // Exclude large directories from output file tracing (Vercel build size)
  outputFileTracingExcludes: {
    '*': [
      './archive/**',
      './docs/**',
      './e2e/**',
      './stories/**',
      './scripts/**',
      './playwright-report/**',
    ],
  },

  // Keep heavy server-only packages out of the client bundle (top-level in Next.js 15+)
  serverExternalPackages: [
    'pino',
    'pino-pretty',
    'sharp',
    'redis',
    'sanitize-html',
    'dompurify',
    'ws',
  ],

  // Experimental features for better performance
  experimental: {
    // Enable optimized loading of CSS
    optimizeCss: true,
    // Client-side router cache: RSC payloads for dynamic routes survive 30 s,
    // static routes survive 3 min — reduces redundant network round-trips on navigation.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
  
  // Reduce bundle size via tree-shakeable per-member imports
  // Note: recharts is intentionally excluded — its /es6/ subpath is not
  // resolvable by Turbopack; import directly from 'recharts' instead.
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
}

module.exports = withNextIntl(nextConfig)
