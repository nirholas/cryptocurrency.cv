import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0a0a0a' },
      ],
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
