import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import CounterClient from './CounterClient';
import { generateSEOMetadata } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'The Counter — AI Fact-Checking & Counter-Arguments',
    description: 'AI-powered fact-checking and counter-argument generation for any crypto claim. Challenge assumptions and find hidden weaknesses.',
    path: '/ai/counter',
    locale,
    tags: ['AI fact check', 'counter arguments', 'crypto claims', 'critical analysis', 'debunk'],
  });
}

export default async function CounterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CounterClient />;
}
