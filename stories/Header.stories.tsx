import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import Header from '../src/components/Header';
import messages from '../messages/en.json';

const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story: React.ComponentType) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkBackground: Story = {
  parameters: { backgrounds: { default: 'dark' } },
};

export const LightBackground: Story = {
  parameters: { backgrounds: { default: 'light' } },
};
