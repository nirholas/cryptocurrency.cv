/**
 * Events & Conferences Calendar
 * Crypto events, conferences, protocol upgrades, halvings, token unlocks, and community meetups
 */

import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SITE_URL } from '@/lib/constants';
import { EventsCalendarClient } from './EventsCalendarClient';

export const metadata: Metadata = {
  title: 'Crypto Events Calendar | Conferences, Halvings & Token Unlocks',
  description:
    'Complete calendar of crypto events, blockchain conferences, protocol upgrades, halvings, token unlocks, and community meetups. Never miss an important date.',
  openGraph: {
    title: 'Crypto Events Calendar | Free Crypto News',
    description:
      'Track every crypto event — conferences, halvings, protocol upgrades, token unlocks, and more.',
    type: 'website',
    images: [{ url: `${SITE_URL}/api/og/events`, width: 1200, height: 630 }],
  },
  keywords: [
    'crypto events',
    'blockchain conferences',
    'crypto calendar',
    'bitcoin halving',
    'token unlock',
    'protocol upgrade',
    'consensus',
    'token2049',
    'ETH Denver',
    'crypto meetup',
  ],
  alternates: { canonical: '/events' },
};

export const dynamic = 'force-dynamic';

export interface CryptoEvent {
  id: string;
  title: string;
  description: string;
  date: string;           // ISO date
  endDate?: string;       // ISO date for multi-day events
  category: EventCategory;
  location?: string;
  url?: string;
  tags: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
  source?: string;
}

export type EventCategory =
  | 'conference'
  | 'halving'
  | 'upgrade'
  | 'token-unlock'
  | 'airdrop'
  | 'fork'
  | 'meetup'
  | 'hackathon'
  | 'regulatory'
  | 'earnings'
  | 'other';

// Static seed events — in production these would come from an API/DB
const SEED_EVENTS: CryptoEvent[] = [
  {
    id: '1',
    title: 'ETH Denver 2026',
    description: 'The largest Ethereum community gathering featuring hackathons, talks, and workshops.',
    date: '2026-02-23',
    endDate: '2026-03-01',
    category: 'conference',
    location: 'Denver, CO',
    url: 'https://ethdenver.com',
    tags: ['ethereum', 'hackathon', 'community'],
    importance: 'high',
  },
  {
    id: '2',
    title: 'Consensus 2026',
    description: 'CoinDesk\'s premier crypto and blockchain conference.',
    date: '2026-05-14',
    endDate: '2026-05-16',
    category: 'conference',
    location: 'Austin, TX',
    url: 'https://consensus.coindesk.com',
    tags: ['industry', 'institutional', 'bitcoin'],
    importance: 'critical',
  },
  {
    id: '3',
    title: 'Token2049 Singapore',
    description: 'Asia\'s largest crypto conference connecting the global industry.',
    date: '2026-09-16',
    endDate: '2026-09-17',
    category: 'conference',
    location: 'Singapore',
    url: 'https://token2049.com',
    tags: ['asia', 'industry', 'trading'],
    importance: 'critical',
  },
  {
    id: '4',
    title: 'Bitcoin Halving (Est.)',
    description: 'The next Bitcoin block reward halving — reducing rewards from 3.125 to 1.5625 BTC per block.',
    date: '2028-04-15',
    category: 'halving',
    tags: ['bitcoin', 'halving', 'supply'],
    importance: 'critical',
  },
  {
    id: '5',
    title: 'Ethereum Pectra Upgrade',
    description: 'Major Ethereum network upgrade combining Prague (execution layer) and Electra (consensus layer) improvements.',
    date: '2026-03-15',
    category: 'upgrade',
    tags: ['ethereum', 'upgrade', 'EIP'],
    importance: 'high',
  },
  {
    id: '6',
    title: 'Devconnect 2026',
    description: 'Week-long Ethereum Foundation event focused on deep technical discussions and workshops.',
    date: '2026-11-10',
    endDate: '2026-11-15',
    category: 'conference',
    location: 'Buenos Aires, Argentina',
    url: 'https://devconnect.org',
    tags: ['ethereum', 'developers', 'research'],
    importance: 'high',
  },
  {
    id: '7',
    title: 'Paris Blockchain Week 2026',
    description: 'Europe\'s leading blockchain & Web3 summit in the heart of Paris.',
    date: '2026-04-08',
    endDate: '2026-04-10',
    category: 'conference',
    location: 'Paris, France',
    url: 'https://parisblockchainweek.com',
    tags: ['europe', 'web3', 'defi'],
    importance: 'medium',
  },
  {
    id: '8',
    title: 'Korea Blockchain Week',
    description: 'Premier crypto event in South Korea bringing together global builders and investors.',
    date: '2026-09-01',
    endDate: '2026-09-05',
    category: 'conference',
    location: 'Seoul, South Korea',
    tags: ['asia', 'korea', 'industry'],
    importance: 'medium',
  },
  {
    id: '9',
    title: 'Solana Breakpoint 2026',
    description: 'Annual flagship conference for the Solana ecosystem.',
    date: '2026-10-20',
    endDate: '2026-10-22',
    category: 'conference',
    location: 'Amsterdam, Netherlands',
    tags: ['solana', 'ecosystem', 'developers'],
    importance: 'high',
  },
  {
    id: '10',
    title: 'SEC Crypto Regulatory Hearing',
    description: 'Congressional hearing on cryptocurrency regulation and market structure.',
    date: '2026-03-20',
    category: 'regulatory',
    location: 'Washington, DC',
    tags: ['regulation', 'SEC', 'policy'],
    importance: 'high',
  },
  {
    id: '11',
    title: 'Bitcoin Nashville 2026',
    description: 'The world\'s largest Bitcoin conference.',
    date: '2026-07-24',
    endDate: '2026-07-26',
    category: 'conference',
    location: 'Nashville, TN',
    tags: ['bitcoin', 'conference', 'maxi'],
    importance: 'high',
  },
  {
    id: '12',
    title: 'ETHGlobal Hackathon — Online',
    description: 'Virtual hackathon for Ethereum developers with $200k+ in prizes.',
    date: '2026-06-12',
    endDate: '2026-06-14',
    category: 'hackathon',
    location: 'Online',
    tags: ['ethereum', 'hackathon', 'prizes'],
    importance: 'medium',
  },
];

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📅 Crypto Events Calendar
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Conferences, protocol upgrades, halvings, regulatory hearings, and community meetups — never miss an important crypto date.
          </p>
        </div>

        <EventsCalendarClient events={SEED_EVENTS} />
      </main>
      <Footer />
    </div>
  );
}
