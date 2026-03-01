import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import DebateClient from './DebateClient';
import { generateSEOMetadata } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'The Debate — AI Bull vs Bear Analysis',
    description: 'Get AI-powered bull and bear perspectives on any crypto topic. Enter any claim and see both sides of the argument.',
    path: '/ai/debate',
    locale,
    tags: ['bull bear', 'AI debate', 'crypto analysis', 'bull case', 'bear case', 'two sides'],
  });
}

export default async function DebatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DebateClient />;
}
