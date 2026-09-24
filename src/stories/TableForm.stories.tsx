import type { Meta, StoryObj } from '@storybook/react';
import { TableForm } from '@/features/table/TableForm';

const meta: Meta<typeof TableForm> = {
  title: 'Table/TableForm',
  component: TableForm,
};

export default meta;
type Story = StoryObj<typeof TableForm>;

const columns = Array.from({ length: 62 }, (_, i) => `col_${i}`);

export const WideTable: Story = {
  args: { npartitions: 3, columns, onSubmit: () => {} },
};

export const SinglePartition: Story = {
  args: { npartitions: 1, columns: ['seq_num', 'time', 'uid'], onSubmit: () => {} },
};
