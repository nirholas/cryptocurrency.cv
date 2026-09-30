/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Vercel injects VERCEL=1 at build time. Production runs on Cloud Run, where the
 * /_vercel/insights and /_vercel/speed-insights scripts 404 and throw on every
 * pageview, so the collectors only render on a Vercel deployment.
 */
const isVercelHosted = process.env.VERCEL === '1';

import { ThemeProvider, ThemeScript } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { BookmarksProvider } from '@/components/BookmarksProvider';
import { PWAProvider } from '@/components/PWAProvider';
import { KeyboardShortcutsProvider } from '@/components/KeyboardShortcuts';
import { WatchlistProvider } from '@/components/watchlist';
import { AlertsProvider } from '@/components/alerts';
import { PortfolioProvider } from '@/components/portfolio';
import { SettingsProvider } from '@/components/SettingsProvider';
import NavigationProgress from '@/components/NavigationProgress';

import { ClientOnly } from '@/components/ClientOnly';
import { locales, isRtlLocale, type Locale } from '@/i18n/config';
import { SITE_URL } from '@/lib/constants';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: false,
});

// Dynamic rendering is auto-detected via headers() call for CSP nonce.
// See https://github.com/nirholas/cryptocurrency.cv/issues/15

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'Crypto Vision — Cryptocurrency Prices, News & Market Data',
    template: '%s | Crypto Vision',
  },
  description:
    'Real-time cryptocurrency prices, breaking news, and market intelligence. 350+ free API endpoints, developer SDKs, AI integrations, and embeddable widgets. Bitcoin, Ethereum, DeFi & altcoins.',
  keywords: [
    'crypto',
    'cryptocurrency',
    'bitcoin',
    'ethereum',
    'crypto prices',
    'market data',
    'news',
    'API',
    'blockchain',
    'defi',
    'trading',
    'crypto vision',
    'crypto platform',
    'live prices',
  ],
  authors: [{ name: 'Crypto Vision' }],
  creator: 'Crypto Vision',
  publisher: 'Crypto Vision',
  metadataBase: new URL(SITE_URL),
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/feed.xml', title: 'Crypto Vision RSS Feed' }],
      'application/feed+json': [{ url: '/feed.json', title: 'Crypto Vision JSON Feed' }],
    },
  },
  openGraph: {
    title: 'Crypto Vision — Cryptocurrency Prices, News & Market Data',
    description:
      'Real-time cryptocurrency prices, breaking news, and market intelligence. 350+ free API endpoints, developer SDKs, and AI integrations.',
    url: SITE_URL,
    siteName: 'Crypto Vision',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Crypto Vision',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crypto Vision — Cryptocurrency Prices, News & Market Data',
    description:
      'Real-time cryptocurrency prices, breaking news, and market intelligence. 350+ free API endpoints, developer SDKs, and AI integrations.',
    images: ['/og-image.png'],
    site: '@nichxbt',
    creator: '@nichxbt',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      {
        url: '/apple-touch-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Crypto Vision',
  },
  category: 'finance',
};

const SSG_LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-CN', 'pt', 'ru', 'ar'] as const;

export function generateStaticParams() {
  if (process.env.VERCEL_ENV || process.env.CI) {
    return SSG_LOCALES.map((locale) => ({ locale }));
  }
  return locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const dir = isRtlLocale(locale as Locale) ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <ThemeScript nonce={nonce} />

        <link rel="preconnect" href="https://api.coingecko.com" />
        <link rel="dns-prefetch" href="https://api.coingecko.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">
        <ClientOnly>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider>
              <ToastProvider>
                <SettingsProvider>
                  <KeyboardShortcutsProvider>
                    <WatchlistProvider>
                      <AlertsProvider>
                        <PortfolioProvider>
                          <BookmarksProvider>
                            <PWAProvider>
                              <NavigationProgress />
                              {children}
                            </PWAProvider>
                          </BookmarksProvider>
                        </PortfolioProvider>
                      </AlertsProvider>
                    </WatchlistProvider>
                  </KeyboardShortcutsProvider>
                </SettingsProvider>
              </ToastProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
          {isVercelHosted && (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          )}
        </ClientOnly>
      </body>
    </html>
  );
}
