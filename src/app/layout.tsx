import './globals.css';
import type { Metadata, Viewport } from 'next';
import { PWAProvider } from '@/components/PWAProvider';
import { InstallPrompt } from '@/components/InstallPrompt';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { BookmarksProvider } from '@/components/BookmarksProvider';
import { ThemeProvider, ThemeScript } from '@/components/ThemeProvider';
import { KeyboardShortcutsProvider } from '@/components/KeyboardShortcuts';
import { WatchlistProvider } from '@/components/watchlist';
import { AlertsProvider } from '@/components/alerts';
import { PortfolioProvider } from '@/components/portfolio';
import { GlobalSearch } from '@/components/GlobalSearch';
import { ToastProvider } from '@/components/Toast';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7931a' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'dark light',
};

export const metadata: Metadata = {
  title: {
    default: 'Free Crypto News',
    template: '%s | Free Crypto News',
  },
  description: '🆓 100% FREE crypto news API. No API keys. No rate limits. Real-time cryptocurrency news aggregation.',
  keywords: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'news', 'API', 'free', 'blockchain', 'defi', 'trading'],
  authors: [{ name: 'Free Crypto News' }],
  creator: 'Free Crypto News',
  publisher: 'Free Crypto News',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://free-crypto-news.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Free Crypto News',
    description: '🆓 100% FREE crypto news API. No API keys. No rate limits.',
    url: 'https://free-crypto-news.vercel.app',
    siteName: 'Free Crypto News',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free Crypto News - 100% Free Crypto News API',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Crypto News',
    description: '🆓 100% FREE crypto news API. No API keys. No rate limits.',
    images: ['/og-image.png'],
    creator: '@freecryptonews',
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
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#f7931a',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CryptoNews',
    startupImage: [
      {
        url: '/splash/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/apple-splash-1668-2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/apple-splash-1536-2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/apple-splash-1125-2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/apple-splash-1242-2688.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/apple-splash-750-1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/apple-splash-640-1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  category: 'news',
  classification: 'Cryptocurrency News',
  other: {
    'msapplication-TileColor': '#f7931a',
    'msapplication-config': '/browserconfig.xml',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'application-name': 'CryptoNews',
    'apple-mobile-web-app-title': 'CryptoNews',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Theme Script - prevents flash of wrong theme */}
        <ThemeScript />
        
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for API endpoints */}
        <link rel="dns-prefetch" href="https://api.coingecko.com" />
        
        {/* PWA splash screens for iOS */}
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-dark.png" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-light.png" media="(prefers-color-scheme: light)" />
      </head>
      <body className="bg-gray-50 dark:bg-slate-900 antialiased min-h-screen text-gray-900 dark:text-slate-100 transition-colors duration-200">
        {/* Skip Link for Accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <KeyboardShortcutsProvider>
              <WatchlistProvider>
                <AlertsProvider>
                  <PortfolioProvider>
                    <BookmarksProvider>
                      <PWAProvider>
                        {children}
                        <GlobalSearch />
                        <InstallPrompt />
                        <UpdatePrompt />
                        <OfflineIndicator />
                      </PWAProvider>
                    </BookmarksProvider>
                  </PortfolioProvider>
                </AlertsProvider>
              </WatchlistProvider>
            </KeyboardShortcutsProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
