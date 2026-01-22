import type { Meta, StoryObj } from '@storybook/react';
import { PriceWidget } from '../src/components/PriceWidget';

const meta: Meta<typeof PriceWidget> = {
  title: 'Components/PriceWidget',
  component: PriceWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: {
    variant: 'compact',
  },
};

export const Full: Story = {
  args: {
    variant: 'full',
  },
};
