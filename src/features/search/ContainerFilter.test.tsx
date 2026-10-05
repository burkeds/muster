import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ContainerFilter } from './ContainerFilter';
import type { TiledSearchFilters } from '@blueskyproject/tiled';

const renderFilter = (props: Partial<Parameters<typeof ContainerFilter>[0]> = {}) => {
  const defaults = {
    filter: undefined as TiledSearchFilters | undefined,
    onApply: vi.fn(),
    onClear: vi.fn(),
    ...props,
  };
  render(<ContainerFilter {...defaults} />);
  return defaults;
};

const keyInput = (i: number) => screen.getAllByPlaceholderText('key')[i];
const valueInput = (i: number) => screen.getAllByPlaceholderText('value')[i];
const searchApply = () => screen.getByRole('button', { name: /Search$/i });

async function expand(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('Search this container'));
}

describe('ContainerFilter', () => {
  it('is collapsed by default and expands to show the search form', async () => {
    const user = userEvent.setup();
    renderFilter();
    expect(screen.queryByPlaceholderText('search text')).not.toBeInTheDocument();
    await expand(user);
    expect(screen.getByPlaceholderText('search text')).toBeInTheDocument();
  });

  it('builds a fulltext filter', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderFilter({ onApply });
    await expand(user);
    await user.type(screen.getByPlaceholderText('search text'), 'Ni');
    await user.click(searchApply());
    expect(onApply).toHaveBeenCalledWith({ fulltext: { text: 'Ni' } });
  });

  it('builds an equality filter on a nested (dotted) key', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderFilter({ onApply });
    await expand(user);
    await user.type(keyInput(0), 'element.name');
    await user.type(valueInput(0), 'helium');
    await user.click(searchApply());
    expect(onApply).toHaveBeenCalledWith({
      eq: { key: 'element.name', value: 'helium' },
    });
  });

  it('builds a comparison filter on a nested key', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderFilter({ onApply });
    await expand(user);
    // key inputs: eq[0], contains[1], in[2], like[3], comparison[4], keypresent[5]
    // value inputs: eq[0], contains[1], comparison[2]
    await user.type(keyInput(4), 'element.atomic_number');
    await user.type(valueInput(2), '2');
    await user.click(searchApply());
    expect(onApply).toHaveBeenCalledWith({
      comparison: {
        key: 'element.atomic_number',
        operator: 'gt',
        value: '2',
      },
    });
  });

  it('builds a like filter', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderFilter({ onApply });
    await expand(user);
    await user.type(keyInput(3), 'element.name');
    await user.type(screen.getByPlaceholderText('pattern'), 'He%');
    await user.click(searchApply());
    expect(onApply).toHaveBeenCalledWith({
      like: { key: 'element.name', pattern: 'He%' },
    });
  });

  it('builds a keyPresent filter for a nested key (exists=true)', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderFilter({ onApply });
    await expand(user);
    await user.type(keyInput(5), 'edges.K');
    await user.click(searchApply());
    expect(onApply).toHaveBeenCalledWith({
      keyPresent: { key: 'edges.K', exists: true },
    });
  });

  it('labels the trigger when a filter is active and clears it', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    renderFilter({ filter: { eq: { key: 'sample', value: 'X' } }, onClear });
    expect(screen.getByText('Filtering this container')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Clear/i }));
    expect(onClear).toHaveBeenCalled();
  });
});
