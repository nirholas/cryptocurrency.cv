import type { Meta, StoryObj } from '@storybook/react';
import CategoryNav from '../src/components/CategoryNav';

/**
 * CategoryNav renders a horizontally-scrollable pill bar for filtering
 * news by category. Uses vanilla `next/link`, no i18n required.
 */

const meta: Meta<typeof CategoryNav> = {
  title: 'Components/CategoryNav',
  component: CategoryNav,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    activeCategory: {
      control: 'select',
      options: ['', 'bitcoin', 'ethereum', 'defi', 'nft', 'regulation', 'markets', 'analysis', 'geopolitical'],
      description: 'The currently active category slug',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllNews: Story = {
  args: { activeCategory: '' },
};

export const Bitcoin: Story = {
  args: { activeCategory: 'bitcoin' },
};

export const Ethereum: Story = {
  args: { activeCategory: 'ethereum' },
};

export const DeFi: Story = {
  args: { activeCategory: 'defi' },
};

export const Regulation: Story = {
  args: { activeCategory: 'regulation' },
};

export const Geopolitical: Story = {
  args: { activeCategory: 'geopolitical' },
};

export const DarkBackground: Story = {
  args: { activeCategory: 'bitcoin' },
  parameters: { backgrounds: { default: 'dark' } },
};

export const LightBackground: Story = {
  args: { activeCategory: 'markets' },
  parameters: { backgrounds: { default: 'light' } },
};
