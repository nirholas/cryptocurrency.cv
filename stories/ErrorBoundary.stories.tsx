import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../messages/en.json';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

const withI18n = (Story: React.ComponentType) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <Story />
  </NextIntlClientProvider>
);

/**
 * ErrorBoundary is a React class component that catches render errors
 * from its children and shows a fallback UI.
 *
 * To demonstrate the error state in Storybook, we render a child that
 * immediately throws during render. You can pass a custom `fallback` or
 * let the built-in fallback render.
 */

function ThrowingChild({ shouldThrow }: { shouldThrow?: boolean }) {
  if (shouldThrow) throw new Error('Story test error: component crashed!');
  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300 text-sm">
      ✅ Children rendered without errors.
    </div>
  );
}

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [withI18n],
  argTypes: {
    showReset: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoError: Story = {
  args: { showReset: true },
  render: (args) => (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ErrorBoundary {...args}>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    </NextIntlClientProvider>
  ),
};

export const WithError: Story = {
  args: { showReset: true },
  render: (args) => (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ErrorBoundary {...args}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    </NextIntlClientProvider>
  ),
};

export const CustomFallback: Story = {
  render: () => (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ErrorBoundary
        fallback={
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 text-yellow-800 dark:text-yellow-200">
            <p className="font-semibold">Custom fallback UI rendered by parent</p>
            <p className="text-sm mt-1 opacity-70">This replaces the built-in error display.</p>
          </div>
        }
      >
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    </NextIntlClientProvider>
  ),
};

export const DarkBackground: Story = {
  ...WithError,
  parameters: { backgrounds: { default: 'dark' } },
};
