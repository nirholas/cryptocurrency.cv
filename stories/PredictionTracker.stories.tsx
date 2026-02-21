import type { Meta, StoryObj } from '@storybook/react';
import PredictionTracker from '../src/components/PredictionTracker';

const meta: Meta<typeof PredictionTracker> = {
  title: 'Components/PredictionTracker',
  component: PredictionTracker,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PredictionTracker>;

export const Default: Story = {};

export const DarkBackground: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
