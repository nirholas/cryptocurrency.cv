import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import DebateClient from './DebateClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  void locale;
  return {
    title: 'The Debate — AI Bull vs Bear Analysis',
    description: 'Get AI-powered bull and bear perspectives on any crypto topic. Enter any claim and see both sides of the argument.',
  };
}

export default async function DebatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DebateClient />;
}
