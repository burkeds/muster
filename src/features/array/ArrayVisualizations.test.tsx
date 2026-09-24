import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-plotly.js', () => ({
  default: ({
    data,
    layout,
  }: {
    data: unknown;
    layout: Record<string, unknown>;
  }) => (
    <div
      data-testid="plotly-plot"
      data-trace-count={Array.isArray(data) ? data.length : 0}
      data-title={(layout?.title as string) ?? ''}
    />
  ),
}));

const mockUseArrayData = vi.fn();
vi.mock('@/hooks/useArrayData', () => ({
  useArrayData: (...args: unknown[]) => mockUseArrayData(...args),
}));

vi.mock('@/lib/plotExporter', () => ({
  downloadPlot: vi.fn(),
  renderPlot: vi.fn(),
}));

import { ArrayView } from './ArrayVisualizations';
import type { NodeResponse } from '@tiled/client-core';

function node(shape: number[]): NodeResponse {
  return {
    data: {
      id: 'arr',
      attributes: { ancestors: [], structure_family: 'array', structure: { shape } },
      links: {},
      meta: null,
    },
    error: null,
    links: null,
    meta: {},
  } as NodeResponse;
}

const loaded = (data: unknown) => ({ data, isLoading: false, isError: false });

beforeEach(() => {
  mockUseArrayData.mockReset();
  mockUseArrayData.mockReturnValue(loaded([]));
});

const lastCall = () => mockUseArrayData.mock.calls[mockUseArrayData.mock.calls.length - 1][0];

describe('ArrayView (1D)', () => {
  it('does not fetch data until a slice is submitted', () => {
    render(<ArrayView segments={['a']} metadata={node([100])} />);
    // Prompt shown, nothing fetched, no plot yet.
    expect(screen.getByText('Request a slice')).toBeInTheDocument();
    expect(screen.queryAllByTestId('plotly-plot')).toHaveLength(0);
    expect(lastCall()).toEqual({ segments: ['a'], slice: undefined, enabled: false });
  });

  it('issues a whole-array request when the user loads the default (whole) slice', async () => {
    const user = userEvent.setup();
    mockUseArrayData.mockReturnValue(loaded([10, 20, 30]));
    render(<ArrayView segments={['a']} metadata={node([3])} />);
    await user.click(screen.getByText('Load'));
    expect(lastCall()).toEqual({ segments: ['a'], slice: undefined, enabled: true });
    expect(screen.getAllByTestId('plotly-plot')).toHaveLength(1);
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.getByText('Bar')).toBeInTheDocument();
  });

  it('requests a range when a slice is entered', async () => {
    const user = userEvent.setup();
    mockUseArrayData.mockReturnValue(loaded([10, 20, 30]));
    render(<ArrayView segments={['a']} metadata={node([100])} />);
    await user.type(screen.getByLabelText('dim 1 slice'), '10:20');
    await user.click(screen.getByText('Load'));
    expect(lastCall()).toEqual({ segments: ['a'], slice: '10:20', enabled: true });
  });
});

describe('ArrayView (ND)', () => {
  it('defaults to the first frame and loads it without extra interaction', async () => {
    const user = userEvent.setup();
    mockUseArrayData.mockReturnValue(loaded([[[1], [2]], [[3], [4]]]));
    render(<ArrayView segments={['a']} metadata={node([2, 3, 4])} />);
    // Three per-dim controls; first defaults to frame 0, the rest whole.
    const inputs = screen.getAllByLabelText(/dim \d slice/);
    expect(inputs).toHaveLength(3);
    expect((inputs[0] as HTMLInputElement).value).toBe('0');

    // Mount fetches nothing; submitting the default (first frame) loads it.
    expect(lastCall()).toEqual({ segments: ['a'], slice: undefined, enabled: false });
    await user.click(screen.getByText('Load'));
    expect(lastCall()).toEqual({ segments: ['a'], slice: '0,:,:', enabled: true });
  });
});
