import type { Meta, StoryObj } from '@storybook/react';
import { InfluencerLeaderboard } from '../src/components/InfluencerLeaderboard';

const meta: Meta<typeof InfluencerLeaderboard> = {
  title: 'Components/InfluencerLeaderboard',
  component: InfluencerLeaderboard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InfluencerLeaderboard>;

export const Default: Story = {};

export const DarkBackground: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
