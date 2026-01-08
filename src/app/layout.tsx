import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Crypto News',
  description: '🆓 100% FREE crypto news API. No API keys. No rate limits.',
  openGraph: {
    title: 'Free Crypto News',
    description: '🆓 100% FREE crypto news API. No API keys. No rate limits.',
    url: 'https://free-crypto-news.vercel.app',
    siteName: 'Free Crypto News',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Crypto News',
    description: '🆓 100% FREE crypto news API. No API keys. No rate limits.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white">{children}</body>
    </html>
  );
}
