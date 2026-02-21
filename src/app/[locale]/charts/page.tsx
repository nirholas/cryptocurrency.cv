import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import ChartsClient from './ChartsClient';

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'TradingView Charts',
    description: 'Professional cryptocurrency charts powered by TradingView with 100+ technical indicators, drawing tools, and real-time data from major exchanges.',
    path: '/charts',
    tags: ['crypto charts', 'tradingview', 'technical analysis', 'bitcoin chart', 'price chart'],
  });
}

export default function ChartsPage() {
  return <ChartsClient />;
}
