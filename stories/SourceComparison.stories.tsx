import type { Meta, StoryObj } from '@storybook/react';
import { SourceComparison } from '../src/components/SourceComparison';

const meta: Meta<typeof SourceComparison> = {
  title: 'Components/SourceComparison',
  component: SourceComparison,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SourceComparison>;

export const Default: Story = {};

export const DarkBackground: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
