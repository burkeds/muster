import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Breadcrumbs',
  component: Breadcrumbs,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="p-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Nested: Story = {
  args: {
    segments: ['a', 'b', 'c'],
    currentIsLeaf: true,
  },
};

export const Root: Story = {
  args: { segments: [], currentIsLeaf: false },
};
