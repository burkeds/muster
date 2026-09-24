import type { Meta, StoryObj } from '@storybook/react';
import { PlotCard } from '@/components/viz/PlotCard';

const meta: Meta<typeof PlotCard> = {
  title: 'Viz/PlotCard',
  component: PlotCard,
};

export default meta;
type Story = StoryObj<typeof PlotCard>;

export const WithPlaceholder: Story = {
  args: {
    title: 'cells3d',
    label: 'Heatmap',
    gd: null,
    filename: 'cells3d',
    children: (
      <div className="flex h-64 items-center justify-center border border-dashed text-muted-foreground">
        Plot renders here
      </div>
    ),
  },
};
