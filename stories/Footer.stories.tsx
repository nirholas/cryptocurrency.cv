import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import Footer from '../src/components/Footer';
import messages from '../messages/en.json';

const meta: Meta<typeof Footer> = {
  title: 'Components/Footer',
  component: Footer,
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
