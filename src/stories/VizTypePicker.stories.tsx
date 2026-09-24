import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { VizTypePicker } from '@/components/viz/VizTypePicker';

function Interactive(args: { options: string[]; initial: string }) {
  const [value, setValue] = useState(args.initial);
  return <VizTypePicker options={args.options} value={value} onChange={setValue} />;
}

const meta: Meta<typeof VizTypePicker> = {
  title: 'Viz/VizTypePicker',
  component: VizTypePicker,
};

export default meta;
type Story = StoryObj<typeof VizTypePicker>;

export const ArrayViews: Story = {
  render: () => <Interactive options={['Line', 'Scatter', 'Bar']} initial="Line" />,
};

export const SurfaceViews: Story = {
  render: () => <Interactive options={['Heatmap', 'Contour', 'Surface']} initial="Heatmap" />,
};
