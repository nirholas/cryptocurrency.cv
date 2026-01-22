import type { Meta, StoryObj } from '@storybook/react';
import { NewsletterForm } from '../src/components/NewsletterForm';

const meta: Meta<typeof NewsletterForm> = {
  title: 'Components/NewsletterForm',
  component: NewsletterForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {
  args: {
    variant: 'card',
  },
};

export const Inline: Story = {
  args: {
    variant: 'inline',
  },
};

export const Banner: Story = {
  args: {
    variant: 'banner',
  },
  parameters: {
    layout: 'fullscreen',
  },
};
