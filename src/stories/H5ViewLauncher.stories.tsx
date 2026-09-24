import type { Meta, StoryObj } from '@storybook/react';

import { H5ViewLauncher } from '@/features/h5/H5ViewLauncher';

const meta: Meta<typeof H5ViewLauncher> = {
  title: 'H5/H5ViewLauncher',
  component: H5ViewLauncher,
  args: {
    segments: ['example.h5'],
    children: (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Normal container listing (children grid) shown by default.
      </div>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof H5ViewLauncher>;

/** Node does not support HDF5: normal content, no button. */
export const Disabled: Story = {
  args: { enabled: false },
};

/** Node supports HDF5: shows a "View with H5Web" button above the listing. */
export const Enabled: Story = {
  args: { enabled: true },
};

/**
 * After clicking "View with H5Web" the in-place explorer is shown (lazy
 * loaded) with a "Back to list" button. Requires a running Tiled server for
 * the explorer to load data.
 */
export const Open: Story = {
  args: { enabled: true },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button');
    button?.click();
  },
};
