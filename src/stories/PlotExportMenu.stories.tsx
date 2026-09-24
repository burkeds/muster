import type { Meta, StoryObj } from '@storybook/react';
import { PlotExportMenu } from '@/components/viz/PlotExportMenu';

const meta: Meta<typeof PlotExportMenu> = {
  title: 'Viz/PlotExportMenu',
  component: PlotExportMenu,
};

export default meta;
type Story = StoryObj<typeof PlotExportMenu>;

export const Ready: Story = {
  args: {
    gd: document.createElement('div') as HTMLDivElement,
    filename: 'my-plot',
  },
};

export const NoGraph: Story = {
  args: {
    gd: null,
    filename: 'my-plot',
  },
};
