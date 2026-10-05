import type { Preview } from '@storybook/react';
import '../tailwind.css';
import '@blueskyproject/tiled/style.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
