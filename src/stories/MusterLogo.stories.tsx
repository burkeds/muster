import type { Meta, StoryObj } from '@storybook/react';
import { MusterLogo } from '@/components/common/MusterLogo';

const meta: Meta<typeof MusterLogo> = {
  title: 'MusterLogo',
  component: MusterLogo,
};

export default meta;
type Story = StoryObj<typeof MusterLogo>;

export const Basic: Story = {
  args: {},
};

export const WithTagline: Story = {
  args: { tagline: true },
};

export const Large: Story = {
  args: { tagline: true, iconClassName: 'h-14 w-14', textClassName: 'text-2xl' },
};
