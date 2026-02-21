import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../messages/en.json';
import NewsCluster from '../src/components/NewsCluster';

const withI18n = (Story: React.ComponentType) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <Story />
  </NextIntlClientProvider>
);

const now = Date.now();

const mockClusters = [
  {
    similarity: 0.92,
    articles: [
      {
        title: 'Bitcoin Breaks $100K Barrier as ETF Inflows Accelerate',
        link: 'https://coindesk.com/btc-100k',
        description: 'Bitcoin has surpassed $100,000 for the first time in history driven by unprecedented institutional demand following spot ETF launches.',
        pubDate: new Date(now - 1800000).toISOString(),
        source: 'CoinDesk',
        timeAgo: '30m ago',
        category: 'general',
      },
      {
        title: 'BTC Tops $100,000 for First Time Ever',
        link: 'https://theblock.co/btc-100k',
        description: 'Bitcoin crossed the six-figure milestone amid record ETF buying.',
        pubDate: new Date(now - 2000000).toISOString(),
        source: 'The Block',
        timeAgo: '33m ago',
        category: 'general',
      },
      {
        title: 'Bitcoin Price Hits $100K in Historic Achievement',
        link: 'https://cointelegraph.com/btc-100k',
        description: 'The largest cryptocurrency by market cap reached $100,000.',
        pubDate: new Date(now - 2400000).toISOString(),
        source: 'CoinTelegraph',
        timeAgo: '40m ago',
        category: 'general',
      },
    ],
  },
  {
    similarity: 0.85,
    articles: [
      {
        title: 'Ethereum Upgrade Reduces Gas Fees by 90% in Live Tests',
        link: 'https://decrypt.co/eth-upgrade',
        description: 'The upcoming Ethereum Pectra upgrade shows dramatic gas fee reductions in testnet conditions.',
        pubDate: new Date(now - 7200000).toISOString(),
        source: 'Decrypt',
        timeAgo: '2h ago',
        category: 'ethereum',
      },
      {
        title: 'Pectra Testnet Shows 90% Lower Gas Costs',
        link: 'https://blockworks.co/eth-pectra',
        description: 'Ethereum foundation developers confirm the Pectra upgrade is on track.',
        pubDate: new Date(now - 7500000).toISOString(),
        source: 'Blockworks',
        timeAgo: '2h ago',
        category: 'ethereum',
      },
    ],
  },
];

const meta: Meta<typeof NewsCluster> = {
  title: 'Components/NewsCluster',
  component: NewsCluster,
  decorators: [withI18n],
  parameters: {
    layout: 'padded',
    nextjs: {
      navigation: {
        pathname: '/en',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NewsCluster>;

export const Default: Story = {
  args: {
    clusters: mockClusters,
    maxClusters: 5,
  },
};

export const SingleCluster: Story = {
  args: {
    clusters: [mockClusters[0]],
    maxClusters: 1,
  },
};

export const TwoClusters: Story = {
  args: {
    clusters: mockClusters,
    maxClusters: 2,
  },
};

export const DarkBackground: Story = {
  args: {
    clusters: mockClusters,
    maxClusters: 5,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
