import type { Meta, StoryObj } from '@storybook/react';
import { NodeCard } from '@/components/common/NodeCard';
import type { ListingItem } from '@/lib/tiledTypes';

const container = {
  id: '1',
  attributes: {
    ancestors: ['generated'],
    structure_family: 'container',
    structure: { contents: null, count: 4 },
    metadata: { sample: 'Ni foil' },
    specs: [],
    sorting: null,
    data_sources: null,
  },
  links: { self: '' },
  meta: null,
} as ListingItem;

const arrayRes = {
  id: '2',
  attributes: {
    ancestors: ['generated', 'arr'],
    structure_family: 'array',
    structure: {
      shape: [100, 100],
      chunks: [],
      dims: null,
      resizable: false,
      data_type: { endianness: 'little', kind: 'f', itemsize: 8, dt_units: null },
    },
    metadata: {},
    specs: [],
    sorting: null,
    data_sources: null,
  },
  links: { self: '' },
  meta: null,
} as ListingItem;

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
