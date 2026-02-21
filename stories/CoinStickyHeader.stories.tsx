import type { Meta, StoryObj } from '@storybook/react';
import { CoinStickyHeader } from '../src/components/CoinStickyHeader';

const meta: Meta<typeof CoinStickyHeader> = {
  title: 'Components/CoinStickyHeader',
  component: CoinStickyHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    symbol: { control: 'text' },
    price: { control: { type: 'number', min: 0 } },
    priceChange24h: { control: { type: 'number', min: -100, max: 100, step: 0.1 } },
    imageUrl: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof CoinStickyHeader>;

/**
 * The sticky header is hidden by default until page is scrolled 200px.
 * To preview it in Storybook, use a custom render that forces it visible.
 */
const ForceVisible = (args: React.ComponentProps<typeof CoinStickyHeader>) => (
  <div>
    <style>{`
      /* Force sticky header visible in Storybook canvas */
      [class*="fixed"][class*="top-0"] {
        transform: translateY(0) !important;
      }
    `}</style>
    <CoinStickyHeader {...args} />
    <div style={{ height: '100px', padding: '20px', color: '#888', fontSize: '12px' }}>
      ↑ Sticky header shown above (normally hidden until scroll)
    </div>
  </div>
);

export const Bitcoin: Story = {
  args: {
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 103245.67,
    priceChange24h: 3.42,
  },
  render: ForceVisible,
};

export const Ethereum: Story = {
  args: {
    name: 'Ethereum',
    symbol: 'ETH',
    price: 3842.15,
    priceChange24h: 1.87,
  },
  render: ForceVisible,
};

export const Solana: Story = {
  args: {
    name: 'Solana',
    symbol: 'SOL',
    price: 187.34,
    priceChange24h: -2.15,
  },
  render: ForceVisible,
};

export const NegativeChange: Story = {
  name: 'Negative 24h change',
  args: {
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 98050.00,
    priceChange24h: -4.82,
  },
  render: ForceVisible,
};

export const LowPriceToken: Story = {
  name: 'Low-priced token',
  args: {
    name: 'Dogecoin',
    symbol: 'DOGE',
    price: 0.00034521,
    priceChange24h: 12.3,
  },
  render: ForceVisible,
};

export const DarkBackground: Story = {
  args: {
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 103245.67,
    priceChange24h: 3.42,
  },
  render: ForceVisible,
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
