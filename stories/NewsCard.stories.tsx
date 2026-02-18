import type { Meta, StoryObj } from '@storybook/react';
import NewsCard from '../src/components/NewsCard';

const mockArticle = {
  title: 'Bitcoin Hits New All-Time High Above $100K',
  link: 'https://example.com/btc-ath',
  description:
    'Bitcoin surpassed $100,000 for the first time, driven by institutional ETF inflows and increasing mainstream adoption.',
  imageUrl: 'https://placehold.co/400x225/1a1a2e/f59e0b?text=BTC+ATH',
  pubDate: new Date().toISOString(),
  source: 'CoinDesk',
  timeAgo: '1h ago',
};

const meta: Meta<typeof NewsCard> = {
  title: 'Components/NewsCard',
  component: NewsCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'compact', 'horizontal'] },
    showDescription: { control: 'boolean' },
    priority: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { article: mockArticle },
};

export const WithoutImage: Story = {
  args: { article: { ...mockArticle, imageUrl: undefined } },
};

export const Compact: Story = {
  args: { article: mockArticle, variant: 'compact' },
};

export const Horizontal: Story = {
  args: { article: mockArticle, variant: 'horizontal' },
};

export const WithoutDescription: Story = {
  args: { article: mockArticle, showDescription: false },
};

export const TheBlockSource: Story = {
  args: {
    article: {
      ...mockArticle,
      source: 'The Block',
      title: 'Ethereum Rolls Out Pectra Upgrade Across All Testnets',
    },
  },
};

export const DecryptSource: Story = {
  args: {
    article: { ...mockArticle, source: 'Decrypt', title: 'NFT Market Rebounds With $500M Weekly Volume' },
  },
};

export const CoinTelegraphSource: Story = {
  args: {
    article: { ...mockArticle, source: 'CoinTelegraph', title: 'Tether Reserves Report Shows 104% Backing Ratio' },
  },
};

export const LongTitle: Story = {
  args: {
    article: {
      ...mockArticle,
      title:
        'SEC Commissioner Signals Potential Approval for Multiple Spot Crypto ETFs Including Solana, Cardano, and XRP Following Successful Bitcoin and Ethereum Launches',
    },
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
      {['CoinDesk', 'The Block', 'Decrypt', 'CoinTelegraph', 'Bitcoin Magazine', 'Blockworks'].map(
        (source, i) => (
          <NewsCard
            key={source}
            article={{
              ...mockArticle,
              source,
              title: `${source}: Crypto Market Update #${i + 1}`,
              link: `https://example.com/article-${i}`,
            }}
          />
        )
      )}
    </div>
  ),
};
