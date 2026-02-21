import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import CompareClient from './CompareClient';

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'Compare Cryptocurrencies',
    description: 'Compare performance, price, market cap, and metrics for multiple cryptocurrencies side-by-side. Supports up to 5 coins.',
    path: '/compare',
    tags: ['compare crypto', 'crypto comparison', 'bitcoin vs ethereum', 'coin comparison', 'price comparison'],
  });
}

export default function ComparePage() {
  return <CompareClient />;
}
