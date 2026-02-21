import type { Meta, StoryObj } from '@storybook/react';
import { CurrencySelector, CurrencyProvider } from '../src/components/CurrencySelector';

/** Wrap in CurrencyProvider so the selector has context */
const withProvider = (Story: React.ComponentType) => (
  <CurrencyProvider>
    <Story />
  </CurrencyProvider>
);

const meta: Meta<typeof CurrencySelector> = {
  title: 'Components/CurrencySelector',
  component: CurrencySelector,
  decorators: [withProvider],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CurrencySelector>;

export const Default: Story = {};

export const InHeaderContext: Story = {
  name: 'In header context',
  decorators: [
    (Story) => (
      <CurrencyProvider>
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-500">Price display:</span>
          <Story />
        </div>
      </CurrencyProvider>
    ),
  ],
};

export const DarkBackground: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
