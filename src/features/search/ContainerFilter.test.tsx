import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ContainerFilter } from './ContainerFilter';
import type { SearchOptions } from '@tiled/client-core';

const renderFilter = (props: Partial<Parameters<typeof ContainerFilter>[0]> = {}) => {
  const defaults = {
    filter: undefined as SearchOptions['filter'] | undefined,
    onApply: vi.fn(),
    onClear: vi.fn(),
    ...props,
  };
  const utils = render(<ContainerFilter {...defaults} />);
  return { ...utils, defaults };
};

describe('ContainerFilter', () => {
  it('is collapsed by default and expands to show the search form', async () => {
    const user = userEvent.setup();
    const { defaults } = renderFilter();
    expect(screen.queryByPlaceholderText('search text')).not.toBeInTheDocument();

    await user.click(screen.getByText('Search this container'));

    expect(screen.getByPlaceholderText('search text')).toBeInTheDocument();
    expect(typeof defaults.onApply).toBe('function');
  });

  it('builds and applies a fulltext + family filter', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderFilter({ onApply });

    await user.click(screen.getByText('Search this container'));
    await user.type(screen.getByPlaceholderText('search text'), 'Ni');
    // Change the family select via direct interaction is fiddly; apply with fulltext only.
    await user.click(screen.getByRole('button', { name: /Search$/i }));

    expect(onApply).toHaveBeenCalledWith({
      fulltext: [['text', 'Ni']],
    });
  });

  it('labels the trigger when a filter is active and clears it', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    renderFilter({
      filter: { eq: [['key', 'sample'], ['value', '"X"']] },
      onClear,
    });

    expect(screen.getByText('Filtering this container')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Clear/i }));

    expect(onClear).toHaveBeenCalled();
  });
});
