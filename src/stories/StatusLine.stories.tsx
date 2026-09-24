import type { Meta, StoryObj } from '@storybook/react';
import { StatusLine } from '@/components/common/StatusLine';

const meta: Meta<typeof StatusLine> = {
  title: 'StatusLine',
  component: StatusLine,
};

export default meta;
type Story = StoryObj<typeof StatusLine>;

export const Basic: Story = {
  args: { text: 'Browse /generated' },
};

export const Live: Story = {
  args: { text: 'Streaming live', live: true },
};
