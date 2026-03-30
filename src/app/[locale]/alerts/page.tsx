/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import AlertsPage from './AlertsContent';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Alerts — Price & News Notifications',
    description: 'Manage your crypto price and news alerts.',
    path: '/alerts',
    locale,
    noindex: true,
  });
}

export default AlertsPage;
