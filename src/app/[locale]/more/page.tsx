/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from '@/i18n/navigation';
import { generateSEOMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import {
  Bell,
  Bookmark,
  Briefcase,
  Calculator,
  BarChart3,
  Code2,
  Eye,
  Fuel,
  Gauge,
  Globe,
  Layers,
  Newspaper,
  BookOpen,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'More — Tools & Features',
    description:
      'Explore all tools, features, and settings. Access your portfolio, alerts, watchlist, and more.',
    path: '/more',
    locale,
    tags: ['tools', 'features', 'menu', 'navigation'],
  });
}

interface MenuItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Your Account',
    items: [
      {
        href: '/watchlist',
        label: 'Watchlist',
        description: 'Track your favorite coins',
        icon: Eye,
      },
      {
        href: '/portfolio',
        label: 'Portfolio',
        description: 'Monitor your holdings & PnL',
        icon: Briefcase,
      },
      {
        href: '/bookmarks',
        label: 'Bookmarks',
        description: 'Saved articles & news',
        icon: Bookmark,
      },
      { href: '/alerts', label: 'Alerts', description: 'Price & news notifications', icon: Bell },
      {
        href: '/settings',
        label: 'Settings',
        description: 'Preferences & configuration',
        icon: Settings,
      },
    ],
  },
  {
    title: 'Market Tools',
    items: [
      {
        href: '/markets',
        label: 'Markets',
        description: 'Real-time prices & charts',
        icon: BarChart3,
      },
      {
        href: '/defi',
        label: 'DeFi Dashboard',
        description: 'Protocols, TVL & yields',
        icon: Layers,
      },
      {
        href: '/fear-greed',
        label: 'Fear & Greed Index',
        description: 'Market sentiment gauge',
        icon: Gauge,
      },
      {
        href: '/gas',
        label: 'Gas Tracker',
        description: 'Live gas fees across chains',
        icon: Fuel,
      },
      {
        href: '/calculator',
        label: 'Calculator',
        description: 'Crypto & fiat converter',
        icon: Calculator,
      },
      {
        href: '/derivatives',
        label: 'Derivatives',
        description: 'Futures & options data',
        icon: TrendingUp,
      },
      {
        href: '/whales',
        label: 'Whale Tracker',
        description: 'Large transactions & wallets',
        icon: Wallet,
      },
    ],
  },
  {
    title: 'Discover',
    items: [
      {
        href: '/sources',
        label: 'News Sources',
        description: '300+ verified sources',
        icon: Newspaper,
      },
      {
        href: '/learn',
        label: 'Learn',
        description: 'Guides, glossary & tutorials',
        icon: BookOpen,
      },
      {
        href: '/newsletters',
        label: 'Newsletters',
        description: 'Daily & weekly digests',
        icon: Globe,
      },
      {
        href: '/authors',
        label: 'Authors',
        description: 'Contributors & journalists',
        icon: Users,
      },
      {
        href: '/developers',
        label: 'API & Developers',
        description: 'REST, RSS, GraphQL & more',
        icon: Code2,
      },
    ],
  },
];

export default async function MorePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main min-h-[60vh] py-8">
        <h1 className="mb-6 font-serif text-2xl font-bold">More</h1>

        <div className="space-y-8">
          {MENU_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-text-tertiary mb-3 px-1 text-xs font-semibold tracking-wider uppercase">
                {section.title}
              </h2>
              <div className="border-border divide-border divide-y overflow-hidden rounded-xl border bg-(--color-surface)">
                {section.items.map(({ href, label, description, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="hover:bg-surface-secondary flex items-center gap-4 px-4 py-3.5 transition-colors"
                  >
                    <div className="bg-surface-secondary text-text-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm font-medium">{label}</p>
                      <p className="text-text-tertiary text-xs">{description}</p>
                    </div>
                    <ChevronRight className="text-text-tertiary h-4 w-4 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
