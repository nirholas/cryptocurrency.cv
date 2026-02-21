import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../messages/en.json';
import FeaturedArticle from '../src/components/FeaturedArticle';
import type { NewsArticle } from '../src/lib/crypto-news';

const withI18n = (Story: React.ComponentType) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <Story />
  </NextIntlClientProvider>
);

const mockArticle: NewsArticle = {
  title: 'Bitcoin Surges Past $100K as Institutional Demand Reaches All-Time High',
  link: 'https://example.com/bitcoin-100k',
  description:
    'Bitcoin has crossed the $100,000 milestone for the first time in history, driven by unprecedented institutional buying pressure following the approval of spot Bitcoin ETFs. Major asset managers have collectively accumulated over $10 billion in BTC holdings since January.',
  pubDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
  source: 'CoinDesk',
  sourceKey: 'coindesk',
  category: 'general',
  timeAgo: '30 minutes ago',
};

const coinTelegraphArticle: NewsArticle = {
  title: 'Ethereum ETF Launches Draw Record $500M in First-Day Inflows',
  link: 'https://example.com/eth-etf-launch',
  description:
    'Ethereum spot ETFs have launched to massive demand, recording $500 million in net inflows on the first day of trading. The launch marks a watershed moment for the second-largest cryptocurrency by market cap.',
  pubDate: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  source: 'CoinTelegraph',
  sourceKey: 'cointelegraph',
  category: 'general',
  timeAgo: '1 hour ago',
};

const blockworksArticle: NewsArticle = {
  title: 'DeFi TVL Hits Record $200B as Yield Farming Renaissance Takes Hold',
  link: 'https://example.com/defi-record',
  description:
    'Total value locked across decentralized finance protocols has reached a new all-time high of $200 billion, signaling the start of what analysts are calling a DeFi Renaissance.',
  pubDate: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  source: 'Blockworks',
  sourceKey: 'blockworks',
  category: 'defi',
  timeAgo: '3 hours ago',
};

const unknownSourceArticle: NewsArticle = {
  title: 'Solana Developers Launch New High-Performance AMM Protocol',
  link: 'https://example.com/solana-amm',
  description:
    'A new automated market maker protocol on Solana promises 1 million transactions per second with sub-cent fees, potentially reshaping the DeFi landscape.',
  pubDate: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  source: 'CryptoDaily',
  sourceKey: 'cryptodaily',
  category: 'defi',
  timeAgo: '6 hours ago',
};

const meta: Meta<typeof FeaturedArticle> = {
  title: 'Components/FeaturedArticle',
  component: FeaturedArticle,
  decorators: [withI18n],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FeaturedArticle>;

export const CoinDeskArticle: Story = {
  name: 'CoinDesk (blue gradient)',
  args: {
    article: mockArticle,
  },
};

export const CoinTelegraphArticle: Story = {
  name: 'CoinTelegraph (dark orange)',
  args: {
    article: coinTelegraphArticle,
  },
};

export const BlockworksArticle: Story = {
  name: 'Blockworks (indigo)',
  args: {
    article: blockworksArticle,
  },
};

export const UnknownSource: Story = {
  name: 'Unknown source (default gradient)',
  args: {
    article: unknownSourceArticle,
  },
};
