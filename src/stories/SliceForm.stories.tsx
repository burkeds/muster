import type { Meta, StoryObj } from '@storybook/react';
import { SliceForm } from '@/features/array/SliceForm';

const meta: Meta<typeof SliceForm> = {
  title: 'Array/SliceForm',
  component: SliceForm,
};

export default meta;
type Story = StoryObj<typeof SliceForm>;

export const TwoDim: Story = {
  args: { ndim: 2, shape: [512, 512], onSubmit: () => {} },
};

export const ND: Story = {
  args: { ndim: 4, shape: [60, 2, 256, 256], onSubmit: () => {} },
};
