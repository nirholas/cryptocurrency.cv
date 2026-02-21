import type { Meta, StoryObj } from '@storybook/react';
import BreakingNewsBanner from '../src/components/BreakingNewsBanner';
import type { NewsArticle } from '../src/lib/crypto-news';

/**
 * BreakingNewsBanner displays a pulsing red alert banner for the top urgent
 * news article. Receives an `articles` array; uses the first item.
 * Returns null when the array is empty.
 */

const sampleArticles: NewsArticle[] = [
  {
    title: 'BREAKING: Major Crypto Exchange Suffers Security Incident',
    link: 'https://example.com/breaking-news',
    description: 'A leading crypto exchange has temporarily suspended withdrawals following an unconfirmed security event.',
    pubDate: new Date().toISOString(),
    source: 'coindesk',
    sourceName: 'CoinDesk',
    sourceKey: 'coindesk',
    category: 'regulation',
    sentiment: 'bearish',
    guid: 'guid-001',
    timeAgo: 'just now',
  } as NewsArticle,
];

const btcBullishArticles: NewsArticle[] = [
  {
    title: 'Bitcoin Breaks $150k — Institutional Demand at Record High',
    link: 'https://example.com/btc-ath',
    description: 'BTC surges to record highs as spot ETF inflows eclipse previous records.',
    pubDate: new Date().toISOString(),
    source: 'bloomberg',
    sourceName: 'Bloomberg Crypto',
    sourceKey: 'bloomberg',
    category: 'bitcoin',
    sentiment: 'bullish',
    guid: 'guid-002',
    timeAgo: '2 minutes ago',
  } as NewsArticle,
];

const meta: Meta<typeof BreakingNewsBanner> = {
  title: 'Components/BreakingNewsBanner',
  component: BreakingNewsBanner,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    articles: sampleArticles,
  },
};

export const BullishHeadline: Story = {
  args: {
    articles: btcBullishArticles,
  },
};

export const LongHeadline: Story = {
  args: {
    articles: [
      {
        ...sampleArticles[0],
        title:
          'URGENT: U.S. Senate Committee Votes to Pass Landmark Cryptocurrency Regulation Bill That Would Require All Exchanges to Register with the SEC',
      },
    ],
  },
};

export const Empty: Story = {
  name: 'Empty (returns null)',
  args: {
    articles: [],
  },
};

export const DarkBackground: Story = {
  args: { articles: sampleArticles },
  parameters: { backgrounds: { default: 'dark' } },
};
