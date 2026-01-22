/**
 * @fileoverview Storybook stories for Article Card components
 * 
 * NOTE: Requires Storybook to be installed:
 * npx storybook@latest init
 * 
 * Run with: npm run storybook
 */

// @ts-nocheck - storybook types not installed
import type { Meta, StoryObj } from '@storybook/react';
import {
  ArticleCardLarge,
  ArticleCardMedium,
  ArticleCardSmall,
  ArticleCardList,
} from './index';

// Article type that matches the components (uses 'link' not 'url')
interface StoryArticle {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  timeAgo: string;
  description?: string;
  category?: string;
  readTime?: string;
  id?: string;
  imageUrl?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  readProgress?: number;
}

// Mock article data for stories
const mockArticle: StoryArticle = {
  title: 'Bitcoin Breaks $100K as Institutional Adoption Accelerates',
  description:
    'Major financial institutions continue to embrace Bitcoin, driving prices to unprecedented levels. The latest rally signals growing mainstream acceptance of cryptocurrency as a legitimate asset class.',
  source: 'CoinDesk',
  timeAgo: '2 hours ago',
  pubDate: new Date().toISOString(),
  link: 'https://example.com/bitcoin-100k',
  readTime: '4 min read',
  id: 'article-1',
  imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800',
  sentiment: 'bullish',
  readProgress: 35,
};

const mockArticles: Record<string, StoryArticle> = {
  coindesk: { ...mockArticle, source: 'CoinDesk' },
  cointelegraph: {
    ...mockArticle,
    source: 'CoinTelegraph',
    title: 'Ethereum 2.0 Staking Reaches New Milestone',
    sentiment: 'neutral',
  },
  decrypt: {
    ...mockArticle,
    source: 'Decrypt',
    title: 'DeFi Protocol Suffers $50M Exploit',
    sentiment: 'bearish',
  },
  theblock: {
    ...mockArticle,
    source: 'The Block',
    title: 'SEC Chair Signals Regulatory Framework Coming',
    sentiment: 'neutral',
  },
  bitcoinmagazine: {
    ...mockArticle,
    source: 'Bitcoin Magazine',
    title: 'Lightning Network Capacity Doubles in 2024',
    sentiment: 'bullish',
  },
  cryptonews: {
    ...mockArticle,
    source: 'CryptoNews',
    title: 'Solana TVL Surpasses $5 Billion',
    sentiment: 'bullish',
  },
  bitcoinist: {
    ...mockArticle,
    source: 'Bitcoinist',
    title: 'Whale Alert: 10,000 BTC Moved to Exchange',
    sentiment: 'bearish',
  },
};

// ============ ArticleCardLarge Stories ============
const metaLarge: Meta<typeof ArticleCardLarge> = {
  title: 'Cards/ArticleCardLarge',
  component: ArticleCardLarge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f172a' },
        { name: 'light', value: '#f8fafc' },
      ],
    },
  },
  argTypes: {
    article: {
      description: 'The article data to display',
      control: 'object',
    },
    showBookmark: {
      description: 'Whether to show the bookmark button',
      control: 'boolean',
    },
    showShare: {
      description: 'Whether to show the share button',
      control: 'boolean',
    },
    showSentiment: {
      description: 'Whether to show sentiment badge',
      control: 'boolean',
    },
  },
};

export default metaLarge;
type StoryLarge = StoryObj<typeof ArticleCardLarge>;

export const DefaultLarge: StoryLarge = {
  args: {
    article: mockArticle,
    showBookmark: true,
    showShare: true,
    showSentiment: true,
  },
};

export const CoinDeskLarge: StoryLarge = {
  args: {
    article: mockArticles.coindesk,
    showBookmark: true,
  },
};

export const CoinTelegraphLarge: StoryLarge = {
  args: {
    article: mockArticles.cointelegraph,
    showBookmark: true,
  },
};

export const DecryptBearish: StoryLarge = {
  args: {
    article: mockArticles.decrypt,
    showBookmark: true,
    showSentiment: true,
  },
};

export const NoImage: StoryLarge = {
  args: {
    article: { ...mockArticle, imageUrl: undefined },
    showBookmark: true,
  },
};

export const MinimalFeatures: StoryLarge = {
  args: {
    article: mockArticle,
    showBookmark: false,
    showShare: false,
    showSentiment: false,
  },
};

// ============ ArticleCardMedium Stories ============
export const MediumCardMeta: Meta<typeof ArticleCardMedium> = {
  title: 'Cards/ArticleCardMedium',
  component: ArticleCardMedium,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
};

export const DefaultMedium: StoryObj<typeof ArticleCardMedium> = {
  render: () => <ArticleCardMedium article={mockArticle} />,
};

export const AllSources: StoryObj<typeof ArticleCardMedium> = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-4xl">
      {Object.values(mockArticles).map((article, idx) => (
        <ArticleCardMedium key={idx} article={article} />
      ))}
    </div>
  ),
};

// ============ ArticleCardSmall Stories ============
export const SmallCardMeta: Meta<typeof ArticleCardSmall> = {
  title: 'Cards/ArticleCardSmall',
  component: ArticleCardSmall,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
};

export const DefaultSmall: StoryObj<typeof ArticleCardSmall> = {
  render: () => <ArticleCardSmall article={mockArticle} />,
};

export const WithRank: StoryObj<typeof ArticleCardSmall> = {
  render: () => <ArticleCardSmall article={mockArticle} rank={1} showRank />,
};

export const TrendingList: StoryObj<typeof ArticleCardSmall> = {
  render: () => (
    <div className="space-y-2 max-w-sm">
      {Object.values(mockArticles)
        .slice(0, 5)
        .map((article, idx) => (
          <ArticleCardSmall key={idx} article={article} rank={idx + 1} showRank />
        ))}
    </div>
  ),
};

// ============ ArticleCardList Stories ============
export const ListCardMeta: Meta<typeof ArticleCardList> = {
  title: 'Cards/ArticleCardList',
  component: ArticleCardList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
};

export const DefaultList: StoryObj<typeof ArticleCardList> = {
  render: () => (
    <ArticleCardList article={mockArticle} showBookmark showShare />
  ),
};

export const WithExternalLink: StoryObj<typeof ArticleCardList> = {
  render: () => (
    <ArticleCardList
      article={mockArticle}
      showBookmark
      externalLink
    />
  ),
};

export const MoreStoriesList: StoryObj<typeof ArticleCardList> = {
  render: () => (
    <div className="space-y-4 max-w-3xl">
      {Object.values(mockArticles).map((article, idx) => (
        <ArticleCardList
          key={idx}
          article={article}
          showBookmark
          showShare
        />
      ))}
    </div>
  ),
};
