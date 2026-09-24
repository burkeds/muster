import type { Meta, StoryObj } from '@storybook/react';
import { NodeCard } from '@/components/common/NodeCard';
import type { Resource, NodeAttributes } from '@tiled/client-core';

const container: Resource<NodeAttributes> = {
  id: '1',
  attributes: {
    ancestors: ['generated'],
    structure_family: 'container',
    structure: { count: 4 },
    metadata: { sample: 'Ni foil' },
  },
  links: {},
  meta: null,
};

const arrayRes: Resource<NodeAttributes> = {
  id: '2',
  attributes: {
    ancestors: ['generated', 'arr'],
    structure_family: 'array',
    structure: { shape: [100, 100] },
    metadata: {},
  },
  links: {},
  meta: null,
};

const meta: Meta<typeof NodeCard> = {
  title: 'NodeCard',
  component: NodeCard,
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof NodeCard>;

export const Container: Story = {
  args: { resource: container, name: 'generated' },
};

export const Array: Story = {
  args: { resource: arrayRes, name: 'arr', isLink: true },
};
