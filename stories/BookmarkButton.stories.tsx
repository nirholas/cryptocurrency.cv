import type { Meta, StoryObj } from '@storybook/react';
import { BookmarkButton } from '../src/components/BookmarkButton';
import { BookmarksProvider } from '../src/components/BookmarksProvider';

const mockArticle = {
  title: 'Bitcoin Surges Past $100K as Institutional Adoption Accelerates',
  link: 'https://example.com/bitcoin-100k',
  source: 'CoinDesk',
  pubDate: new Date().toISOString(),
};

const meta: Meta<typeof BookmarkButton> = {
  title: 'Components/BookmarkButton',
  component: BookmarkButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType) => (
      <BookmarksProvider>
        <Story />
      </BookmarksProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    article: mockArticle,
  },
};

export const WithLabel: Story = {
  args: {
    article: mockArticle,
    showLabel: true,
  },
};

export const Multiple: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
          <BookmarkButton article={{ ...mockArticle, link: `${mockArticle.link}-${i}` }} />
          <span className="text-sm">Article {i}</span>
        </div>
      ))}
    </div>
  ),
};
