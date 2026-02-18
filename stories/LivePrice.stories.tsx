import type { Meta, StoryObj } from '@storybook/react';
import { LivePrice, LivePriceTicker, LivePriceCard } from '../src/components/LivePrice';

/**
 * LivePrice components show real-time cryptocurrency prices via WebSocket.
 * In Storybook, the WebSocket will not be active so components fall back
 * to the `initialPrice` prop — the expected graceful-degradation behaviour.
 */

const meta: Meta<typeof LivePrice> = {
  title: 'Components/LivePrice',
  component: LivePrice,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    showChange: { control: 'boolean' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof LivePrice>;

export const Bitcoin: Story = { args: { coinId: 'bitcoin', initialPrice: 104250 } };
export const Ethereum: Story = { args: { coinId: 'ethereum', initialPrice: 3895 } };
export const SmallCoin: Story = { args: { coinId: 'pepe', initialPrice: 0.00001234 } };

export const WithCustomClass: Story = {
  args: { coinId: 'bitcoin', initialPrice: 104250, className: 'text-2xl font-bold' },
};

export const Ticker: StoryObj<typeof LivePriceTicker> = {
  render: () => (
    <LivePriceTicker
      coins={[
        { id: 'bitcoin', symbol: 'BTC', initialPrice: 104250 },
        { id: 'ethereum', symbol: 'ETH', initialPrice: 3895 },
        { id: 'solana', symbol: 'SOL', initialPrice: 198 },
        { id: 'binancecoin', symbol: 'BNB', initialPrice: 625 },
        { id: 'ripple', symbol: 'XRP', initialPrice: 2.45 },
      ]}
    />
  ),
};

export const Card: StoryObj<typeof LivePriceCard> = {
  render: () => (
    <div className="max-w-sm">
      <LivePriceCard coinId="bitcoin" symbol="btc" name="Bitcoin" initialPrice={104250} initialChange24h={3.42} image="https://assets.coingecko.com/coins/images/1/small/bitcoin.png" />
    </div>
  ),
};

export const CardBearish: StoryObj<typeof LivePriceCard> = {
  render: () => (
    <div className="max-w-sm">
      <LivePriceCard coinId="ethereum" symbol="eth" name="Ethereum" initialPrice={3895} initialChange24h={-4.82} image="https://assets.coingecko.com/coins/images/279/small/ethereum.png" />
    </div>
  ),
};

export const CardWithoutImage: StoryObj<typeof LivePriceCard> = {
  render: () => (
    <div className="max-w-sm">
      <LivePriceCard coinId="solana" symbol="sol" name="Solana" initialPrice={198} initialChange24h={8.21} />
    </div>
  ),
};

export const CardGrid: StoryObj<typeof LivePriceCard> = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
      <LivePriceCard coinId="bitcoin" symbol="btc" name="Bitcoin" initialPrice={104250} initialChange24h={3.42} image="https://assets.coingecko.com/coins/images/1/small/bitcoin.png" />
      <LivePriceCard coinId="ethereum" symbol="eth" name="Ethereum" initialPrice={3895} initialChange24h={5.18} image="https://assets.coingecko.com/coins/images/279/small/ethereum.png" />
      <LivePriceCard coinId="solana" symbol="sol" name="Solana" initialPrice={198} initialChange24h={-2.1} image="https://assets.coingecko.com/coins/images/4128/small/solana.png" />
      <LivePriceCard coinId="ripple" symbol="xrp" name="XRP" initialPrice={2.45} initialChange24h={4.33} image="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" />
    </div>
  ),
};
