import type { Meta, StoryObj } from '@storybook/react';
import { SocialBuzz } from '../src/components/SocialBuzz';

/**
 * SocialBuzz fetches trending data internally from CoinGecko.
 * In Storybook, the fetch may fail gracefully and display a loading or error state.
 */

const meta: Meta<typeof SocialBuzz> = {
  title: 'Components/SocialBuzz',
  component: SocialBuzz,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InContainer: Story = {
  decorators: [
    (Story: React.ComponentType) => (
      <div className="max-w-4xl mx-auto py-8">
        <Story />
      </div>
    ),
  ],
};
