import type { Meta, StoryObj } from '@storybook/react';
import { AnomalyAlertsBanner } from '../src/components/AnomalyAlertsBanner';

const meta: Meta<typeof AnomalyAlertsBanner> = {
  title: 'Components/AnomalyAlertsBanner',
  component: AnomalyAlertsBanner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    maxAlerts: { control: { type: 'number', min: 1, max: 10 } },
    showDismiss: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof AnomalyAlertsBanner>;

export const Default: Story = {
  args: {
    maxAlerts: 3,
    showDismiss: true,
  },
};

export const NoDismiss: Story = {
  name: 'No dismiss buttons',
  args: {
    maxAlerts: 3,
    showDismiss: false,
  },
};

export const ShowMore: Story = {
  name: 'Show up to 5 alerts',
  args: {
    maxAlerts: 5,
    showDismiss: true,
  },
};

export const DarkBackground: Story = {
  args: {
    maxAlerts: 3,
    showDismiss: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
