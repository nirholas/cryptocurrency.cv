/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import { generateSEOMetadata } from '@/lib/seo';
import { ClientOnly } from '@/components/ClientOnly';
import X402Visualizer from '@/components/X402Visualizer';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'x402 Payment Protocol Visualizer — Real-Time Network Activity',
    description:
      'Explore x402 payment protocol transactions in real-time with an interactive 3D visualization. See payment flows between protocols like Coinbase, Base, USDC, Stripe, Aave, and more.',
    path: '/x402',
    locale,
  });
}

export default async function X402Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ClientOnly>
      <X402Visualizer />
    </ClientOnly>
  );
}
