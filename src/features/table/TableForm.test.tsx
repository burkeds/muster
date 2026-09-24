import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TableForm } from './TableForm';

const openSelect = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('combobox'));
};

const openColumns = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /columns/ }));
};

describe('TableForm', () => {
  it('submits all columns and partition 0 by default', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TableForm npartitions={2} columns={['a', 'b', 'c']} onSubmit={onSubmit} />);
    expect(screen.getByTestId('table-request-description')).toHaveTextContent('3/3 columns · partition 0/2');
    await user.click(screen.getByText('Load'));
    expect(onSubmit).toHaveBeenCalledWith({ partition: 0, columns: ['a', 'b', 'c'] });
  });

  it('submits the chosen partition from the dropdown', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TableForm npartitions={4} columns={['a', 'b']} onSubmit={onSubmit} />);
    await openSelect(user);
    await user.click(screen.getByRole('option', { name: '2' }));
    expect(screen.getByTestId('table-request-description')).toHaveTextContent('partition 2/4');
    await user.click(screen.getByText('Load'));
    expect(onSubmit).toHaveBeenCalledWith({ partition: 2, columns: ['a', 'b'] });
  });

  it('uses single-partition wording and always keeps Load enabled for npartitions=1', () => {
    render(<TableForm npartitions={1} columns={['a', 'b']} onSubmit={vi.fn()} />);
    expect(screen.getByText('Partition (only 0)')).toBeInTheDocument();
    expect(screen.getByTestId('table-request-description')).toHaveTextContent('single partition');
    expect(screen.getByText('Load')).toBeEnabled();
  });

  it('does not offer any partition beyond the declared count', async () => {
    const user = userEvent.setup();
    render(<TableForm npartitions={1} columns={['a', 'b']} onSubmit={vi.fn()} />);
    await openSelect(user);
    expect(screen.getByRole('option', { name: '0' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '1' })).not.toBeInTheDocument();
  });

  it('warns when all columns are selected', () => {
    render(<TableForm npartitions={1} columns={['a', 'b', 'c', 'd']} onSubmit={vi.fn()} />);
    expect(screen.getByText(/Fetching all 4 columns/)).toBeInTheDocument();
  });

  it('shows Select All (checked by default) and Select None', async () => {
    const user = userEvent.setup();
    render(<TableForm npartitions={1} columns={['a', 'b']} onSubmit={vi.fn()} />);
    await openColumns(user);
    const selectAll = screen.getByText('Select All');
    expect(selectAll).toBeInTheDocument();
    expect(selectAll.closest('[role="menuitemcheckbox"]')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Select None')).toBeInTheDocument();
  });

  it('Select None deselects all columns, disables Load, and keeps the menu open', async () => {
    const user = userEvent.setup();
    render(<TableForm npartitions={1} columns={['a', 'b', 'c']} onSubmit={vi.fn()} />);
    await openColumns(user);
    await user.click(screen.getByText('Select None'));
    expect(screen.getByTestId('table-request-description')).toHaveTextContent('0/3 columns');
    expect(screen.getByText('Load')).toBeDisabled();
    // The menu stays open after a selection.
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('Select All re-selects everything after Select None without the menu closing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TableForm npartitions={1} columns={['a', 'b', 'c']} onSubmit={onSubmit} />);
    await openColumns(user);
    await user.click(screen.getByText('Select None'));
    // The menu is still open, so Select All is directly clickable.
    await user.click(screen.getByText('Select All'));
    expect(screen.getByTestId('table-request-description')).toHaveTextContent('3/3 columns');
    expect(screen.getByText('Load')).toBeEnabled();
    // Close the menu before clicking Load.
    await user.keyboard('{Escape}');
    await user.click(screen.getByText('Load'));
    expect(onSubmit).toHaveBeenCalledWith({ partition: 0, columns: ['a', 'b', 'c'] });
  });

  it('toggling a single column keeps the menu open', async () => {
    const user = userEvent.setup();
    render(<TableForm npartitions={1} columns={['a', 'b']} onSubmit={vi.fn()} />);
    await openColumns(user);
    await user.click(screen.getByText('b'));
    expect(screen.getByTestId('table-request-description')).toHaveTextContent('1/2 columns');
    // Menu stays open and Select None is still visible.
    expect(screen.getByText('Select None')).toBeInTheDocument();
  });
});
