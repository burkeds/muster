import type { Meta, StoryObj } from '@storybook/react';
import { App, MockProvider } from '@h5web/app';

import { H5ExploreView } from '@/features/h5/H5ExploreView';

const meta: Meta<typeof H5ExploreView> = {
  title: 'H5/H5ExploreView',
  component: H5ExploreView,
};

export default meta;
type Story = StoryObj<typeof H5ExploreView>;

/** Shows the embedded h5web explorer UI using h5web's own mock data. */
export const MockExplorer: Story = {
  render: () => (
    <div className="h-[70vh] overflow-hidden rounded-md border">
      <MockProvider>
        <App initialPath="/" disableDarkMode />
      </MockProvider>
    </div>
  ),
};

/**
 * The real component, backed by a Tiled server. It renders h5web's explorer
 * rooted at the given container node and only works against a running Tiled
 * instance that exposes an `application/x-hdf5` node (e.g.
 * `tiled serve directory ./h5-files --watch`).
 */
export const ConnectedToTiled: Story = {
  args: { segments: ['example.h5'] },
};
