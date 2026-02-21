import type { Meta, StoryObj } from '@storybook/react';
import { ExportButton } from '../src/components/ExportData';

const sampleData = () => ({
  filename: 'crypto-news-export',
  headers: ['Title', 'Source', 'Category', 'Date', 'Sentiment'],
  rows: [
    ['Bitcoin Surges Past $100K', 'CoinDesk', 'general', '2025-01-15', 'positive'],
    ['Ethereum ETF Approved', 'The Block', 'ethereum', '2025-01-14', 'positive'],
    ['DeFi TVL Hits Record', 'Decrypt', 'defi', '2025-01-13', 'neutral'],
    ['SEC Charges Exchange', 'CoinTelegraph', 'regulation', '2025-01-12', 'negative'],
    ['Solana Outage Resolved', 'Blockworks', 'general', '2025-01-11', 'neutral'],
  ],
});

const meta: Meta<typeof ExportButton> = {
  title: 'Components/ExportButton',
  component: ExportButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ExportButton>;

export const Default: Story = {
  args: {
    getData: sampleData,
    label: 'Export',
  },
};

export const CustomLabel: Story = {
  name: 'Custom label',
  args: {
    getData: sampleData,
    label: 'Download Data',
  },
};

export const InContext: Story = {
  name: 'In table context',
  render: () => (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Recent News</h3>
        <ExportButton getData={sampleData} label="Export CSV" />
      </div>
      <p className="text-sm text-gray-500">Table content here...</p>
    </div>
  ),
};

export const DarkBackground: Story = {
  args: {
    getData: sampleData,
    label: 'Export Data',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
