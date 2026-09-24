import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-plotly.js', () => ({
  default: ({ data }: { data: unknown }) => (
    <div data-testid="plotly-plot" data-trace-count={Array.isArray(data) ? data.length : 0} />
  ),
}));

vi.mock('@/lib/plotExporter', () => ({
  downloadPlot: vi.fn(),
  renderPlot: vi.fn(),
}));

const mockUseTableData = vi.fn();
vi.mock('@/hooks/useTableData', () => ({
  useTableData: (...args: unknown[]) => mockUseTableData(...args),
}));

import { TableView } from './TableView';
import type { NodeResponse } from '@tiled/client-core';

const metadata = {
  data: {
    id: 't',
    attributes: {
      ancestors: ['short_table'],
      structure_family: 'table',
      structure: { columns: ['a', 'b'], npartitions: 2 },
    },
    links: {},
    meta: null,
  },
  error: null,
  links: null,
  meta: {},
} as NodeResponse;

beforeEach(() => {
  mockUseTableData.mockReset();
  mockUseTableData.mockReturnValue({
    data: { a: [1, 2], b: ['x', 'y'] },
    isLoading: false,
    isError: false,
  });
});

const lastCall = () => mockUseTableData.mock.calls[mockUseTableData.mock.calls.length - 1][0];

describe('TableView', () => {
  it('does not fetch data until a request is submitted', () => {
    render(<TableView segments={['short_table']} metadata={metadata} />);
    expect(screen.getByText('Request a table view')).toBeInTheDocument();
    expect(lastCall()).toEqual({
      segments: ['short_table'],
      partition: 0,
      columns: [],
      enabled: false,
    });
  });

  it('renders column headers and rows after loading', async () => {
    const user = userEvent.setup();
    mockUseTableData.mockReturnValue({
      data: { a: [1, 2], b: ['x', 'y'] },
      isLoading: false,
      isError: false,
    });
    render(<TableView segments={['short_table']} metadata={metadata} />);
    await user.click(screen.getByText('Load'));

    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('x')).toBeInTheDocument();
    expect(screen.getByText(/partition 0\/2/)).toBeInTheDocument();
  });

  it('shows a loading state after submitting', async () => {
    const user = userEvent.setup();
    mockUseTableData.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<TableView segments={['short_table']} metadata={metadata} />);
    await user.click(screen.getByText('Load'));
    expect(screen.getByText(/Loading table/)).toBeInTheDocument();
  });

  it('charts the loaded columns when switched to Chart', async () => {
    const user = userEvent.setup();
    render(<TableView segments={['short_table']} metadata={metadata} />);
    await user.click(screen.getByText('Load'));
    await user.click(screen.getByText('Chart'));
    // Defaults: x = 'a', y = ['b'].
    expect(screen.getAllByTestId('plotly-plot')).toHaveLength(1);
    expect(screen.getByText(/a vs b/)).toBeInTheDocument();
  });
});
