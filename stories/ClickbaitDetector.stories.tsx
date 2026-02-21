import type { Meta, StoryObj } from '@storybook/react';
import { ClickbaitDetector } from '../src/components/ClickbaitDetector';

const meta: Meta<typeof ClickbaitDetector> = {
  title: 'Components/ClickbaitDetector',
  component: ClickbaitDetector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    source: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ClickbaitDetector>;

export const NeutralHeadline: Story = {
  name: 'Neutral headline',
  args: {
    title: 'Bitcoin price reaches $100,000 as ETF inflows accelerate',
    source: 'CoinDesk',
  },
};

export const ClickbaitHeadline: Story = {
  name: 'Clickbait headline',
  args: {
    title: 'SHOCKING: Bitcoin EXPOSED as the biggest scam in history!! You won\'t believe what experts found',
    source: 'CryptoPump',
  },
};

export const MildClickbait: Story = {
  name: 'Mild clickbait',
  args: {
    title: 'Here\'s why Bitcoin will EXPLODE to $1 million in 2025',
    source: 'CryptoInsider',
  },
};

export const TrustedSource: Story = {
  name: 'Trusted source',
  args: {
    title: 'Federal Reserve signals potential interest rate cuts amid crypto market rally',
    source: 'Reuters',
  },
};

export const DarkBackground: Story = {
  args: {
    title: 'Bitcoin Surges Past $100K for the First Time',
    source: 'CoinDesk',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
