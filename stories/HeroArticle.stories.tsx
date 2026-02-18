import type { Meta, StoryObj } from '@storybook/react';
import HeroArticle from '../src/components/HeroArticle';

const mockArticle = {
  title: 'Bitcoin Surges Past $100K as Institutional Adoption Accelerates',
  link: 'https://example.com/bitcoin-100k',
  description:
    'Bitcoin surpassed $100,000 for the first time as major financial institutions continue to increase their crypto exposure through ETFs and direct holdings.',
  imageUrl: 'https://placehold.co/800x450/1a1a2e/f59e0b?text=BTC+%24100K',
  pubDate: new Date().toISOString(),
  source: 'CoinDesk',
  timeAgo: '2h ago',
  sentiment: 'positive',
};

const mockSidebar = [
  {
    title: 'Ethereum Layer 2 TVL Hits Record $50B',
    link: 'https://example.com/eth-l2',
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    source: 'The Block',
    timeAgo: '3h ago',
    sentiment: 'positive',
  },
  {
    title: 'SEC Delays Decision on Solana ETF Application',
    link: 'https://example.com/sol-etf',
    pubDate: new Date(Date.now() - 7200000).toISOString(),
    source: 'Decrypt',
    timeAgo: '4h ago',
    sentiment: 'neutral',
  },
  {
    title: 'Stablecoin Market Cap Exceeds $200 Billion',
    link: 'https://example.com/stablecoins',
    pubDate: new Date(Date.now() - 10800000).toISOString(),
    source: 'CoinTelegraph',
    timeAgo: '5h ago',
    sentiment: 'positive',
  },
  {
    title: 'DeFi Protocol Reports $10M Exploit via Flash Loan Attack',
    link: 'https://example.com/defi-exploit',
    pubDate: new Date(Date.now() - 14400000).toISOString(),
    source: 'The Defiant',
    timeAgo: '6h ago',
    sentiment: 'negative',
  },
  {
    title: 'Blockworks Research: Crypto VC Funding Up 120% YoY',
    link: 'https://example.com/vc-funding',
    pubDate: new Date(Date.now() - 18000000).toISOString(),
    source: 'Blockworks',
    timeAgo: '7h ago',
    sentiment: 'positive',
  },
];

const meta: Meta<typeof HeroArticle> = {
  title: 'Components/HeroArticle',
  component: HeroArticle,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    article: mockArticle,
    sidebarArticles: mockSidebar,
  },
};

export const WithoutSidebar: Story = {
  args: {
    article: mockArticle,
    sidebarArticles: [],
  },
};

export const NegativeSentiment: Story = {
  args: {
    article: {
      ...mockArticle,
      title: 'Crypto Market Drops 15% in Flash Crash as Whale Liquidations Cascade',
      description:
        'A sudden sell-off triggered over $2 billion in liquidations across exchanges, sending Bitcoin below key support levels.',
      source: 'The Block',
      sentiment: 'negative',
    },
    sidebarArticles: mockSidebar,
  },
};

export const WithoutImage: Story = {
  args: {
    article: {
      ...mockArticle,
      imageUrl: undefined,
    },
    sidebarArticles: mockSidebar,
  },
};
