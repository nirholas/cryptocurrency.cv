import type { Meta, StoryObj } from '@storybook/react';
import { WhaleAlerts } from '../src/components/WhaleAlerts';

const meta: Meta<typeof WhaleAlerts> = {
  title: 'Components/WhaleAlerts',
  component: WhaleAlerts,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    limit: { control: { type: 'number', min: 5, max: 50 } },
    minValue: { control: { type: 'number', min: 10000, max: 10000000, step: 10000 } },
    blockchain: {
      control: 'select',
      options: ['all', 'ethereum', 'bitcoin'],
    },
    autoRefresh: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof WhaleAlerts>;

export const Default: Story = {
  args: {
    limit: 20,
    minValue: 100000,
    blockchain: 'all',
    autoRefresh: false,
  },
};

export const EthereumOnly: Story = {
  name: 'Ethereum only',
  args: {
    limit: 10,
    minValue: 100000,
    blockchain: 'ethereum',
    autoRefresh: false,
  },
};

export const BitcoinOnly: Story = {
  name: 'Bitcoin only',
  args: {
    limit: 10,
    minValue: 500000,
    blockchain: 'bitcoin',
    autoRefresh: false,
  },
};

export const HighValueFilter: Story = {
  name: 'High value filter ($1M+)',
  args: {
    limit: 20,
    minValue: 1000000,
    blockchain: 'all',
    autoRefresh: false,
  },
};

export const DarkBackground: Story = {
  args: {
    limit: 20,
    minValue: 100000,
    blockchain: 'all',
    autoRefresh: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
