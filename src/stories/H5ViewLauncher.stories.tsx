import type { Meta, StoryObj } from '@storybook/react';

import { H5ViewLauncher } from '@/features/h5/H5ViewLauncher';

const meta: Meta<typeof H5ViewLauncher> = {
  title: 'H5/H5ViewLauncher',
  component: H5ViewLauncher,
  args: {
    segments: ['example.h5'],
    available: true,
    compatible: true,
    children: (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Normal container listing (children grid) shown by default.
      </div>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof H5ViewLauncher>;

/** Node does not offer HDF5: normal content, no button. */
export const Unavailable: Story = {
  args: { available: false },
};

/** Node offers HDF5 and is explorable: shows an enabled "View with H5Web" button. */
export const Enabled: Story = {
  args: { available: true, compatible: true },
};

/** Node offers HDF5 but the subtree is not explorable: button is greyed out. */
export const Incompatible: Story = {
  args: { available: true, compatible: false },
};

/** After clicking "View with H5Web" the in-place explorer is shown (lazy
 * loaded) with a "Back to list" button. Requires a running Tiled server for
 * the explorer to load data. */
export const Open: Story = {
  args: { available: true, compatible: true },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button');
    button?.click();
  },
};
