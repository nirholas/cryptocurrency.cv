import type { Meta, StoryObj } from '@storybook/react';
import ConnectionStatus from '../src/components/ConnectionStatus';
import type { ConnectionState } from '../src/components/ConnectionStatus';

/**
 * ConnectionStatus visualises the WebSocket connection state.
 * Pass `state` to override the live hook for visual testing.
 */

const meta: Meta<typeof ConnectionStatus> = {
  title: 'Components/ConnectionStatus',
  component: ConnectionStatus,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    state: {
      control: 'select',
      options: ['connected', 'connecting', 'disconnected', 'error', 'reconnecting'] satisfies ConnectionState[],
    },
    variant: {
      control: 'select',
      options: ['inline', 'floating', 'minimal'],
    },
    showReconnectButton: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: { state: 'connected', variant: 'inline' },
};

export const Connecting: Story = {
  args: { state: 'connecting', variant: 'inline' },
};

export const Disconnected: Story = {
  args: { state: 'disconnected', variant: 'inline', showReconnectButton: true },
};

export const Error: Story = {
  args: { state: 'error', variant: 'inline', showReconnectButton: true },
};

export const Reconnecting: Story = {
  args: { state: 'reconnecting', variant: 'inline' },
};

export const Minimal: Story = {
  args: { state: 'connected', variant: 'minimal' },
};

export const Floating: Story = {
  args: { state: 'disconnected', variant: 'floating', showReconnectButton: true },
};

export const WithCustomLabel: Story = {
  args: { state: 'connected', variant: 'inline', label: 'Price Feed' },
};

export const DarkBackground: Story = {
  args: { state: 'connected', variant: 'inline' },
  parameters: { backgrounds: { default: 'dark' } },
};
