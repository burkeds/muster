import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
const mockUseNodeSearch = vi.fn();
vi.mock('@/hooks/useNodeSearch', () => ({
  useNodeSearch: (...args: unknown[]) => mockUseNodeSearch(...args),
}));
const mockUseNodeMetadata = vi.fn();
vi.mock('@/hooks/useNodeMetadata', () => ({
  useNodeMetadata: (...args: unknown[]) => mockUseNodeMetadata(...args),
}));
vi.mock('@/hooks/useServerInfo', () => ({
  useServerInfo: () => ({
    data: { formats: { container: ['application/x-hdf5', 'application/json'] } },
  }),
}));

const mockUseVerifiedEmpty = vi.fn();
vi.mock('@/features/node/useVerifiedEmpty', () => ({
  useVerifiedEmptyContainers: (...args: unknown[]) => mockUseVerifiedEmpty(...args),
}));

vi.mock('@/features/h5/H5ExploreView', () => ({
  H5ExploreView: ({ segments }: { segments: string[] }) => (
    <div data-testid="h5-view">{segments.join('/')}</div>
  ),
}));

import { BrowsePage } from './BrowsePage';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/browse/*" element={<BrowsePage />} />
      </Routes>
    </MemoryRouter>,
  );

function baseResult(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      data: [
        {
          id: 'sub',
          attributes: {
            ancestors: ['generated'],
            structure_family: 'container',
            structure: { count: 2 },
            metadata: {},
          },
          links: {},
          meta: null,
        },
        {
          id: 'plot',
          attributes: {
            ancestors: ['generated'],
            structure_family: 'array',
            structure: { shape: [10] },
            metadata: {},
          },
          links: {},
          meta: null,
        },
      ],
      meta: { count: 2 },
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe('BrowsePage', () => {
  beforeEach(() => {
    mockUseNodeMetadata.mockReturnValue({ data: undefined, isLoading: false });
    // Nothing is verified-empty by default; individual tests override with the
    // set of confirmed-empty container ids.
    mockUseVerifiedEmpty.mockReturnValue(new Set());
    // The "hide empty containers" preference is persisted to localStorage; reset
    // it so tests never inherit state toggled by an earlier test.
    localStorage.clear();
  });

  it('renders children with breadcrumbs and status', () => {
    mockUseNodeSearch.mockReturnValue(baseResult());
    renderAt('/browse/generated');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('generated')).toBeInTheDocument();
    expect(screen.getByText('sub')).toBeInTheDocument();
    expect(screen.getByText('plot')).toBeInTheDocument();
    expect(screen.getByTestId('status-line-text')).toHaveTextContent('Browse /generated');
  });

  it('shows an error state', () => {
    mockUseNodeSearch.mockReturnValue(
      baseResult({ isError: true, error: new Error('boom'), data: undefined }),
    );
    renderAt('/browse/generated');
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    mockUseNodeSearch.mockReturnValue(baseResult({ isLoading: true, data: undefined }));
    renderAt('/browse/generated');
    expect(screen.getByText(/Loading contents/)).toBeInTheDocument();
  });

  it('offers an Export button when viewing a container and opens the download dialog', async () => {
    const user = userEvent.setup();
    mockUseNodeSearch.mockReturnValue(baseResult());
    renderAt('/browse/generated');

    const exportBtn = screen.getByText('Export');
    expect(exportBtn).toBeInTheDocument();
    await user.click(exportBtn);
    expect(screen.getByText('Download container')).toBeInTheDocument();
  });

  it('shows no Export button at the root listing', () => {
    mockUseNodeSearch.mockReturnValue(baseResult());
    renderAt('/browse');
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
  });

  it('offers "View with H5Web" for an HDF5 container and toggles the explorer', async () => {
    const user = userEvent.setup();
    mockUseNodeSearch.mockReturnValue(baseResult());
    mockUseNodeMetadata.mockReturnValue({
      data: {
        id: 'generated',
        attributes: {
          structure_family: 'container',
          data_sources: [{ mimetype: 'application/x-hdf5' }],
        },
      },
      isLoading: false,
    });
    renderAt('/browse/generated');

    expect(screen.getByText('View with H5Web')).toBeInTheDocument();

    await user.click(screen.getByText('View with H5Web'));

    expect(await screen.findByTestId('h5-view')).toHaveTextContent('generated');
    expect(screen.getByText('Back to list')).toBeInTheDocument();
  });

  it('greys out the H5Web button when the container is not explorable', () => {
    mockUseNodeSearch.mockReturnValue(
      baseResult({
        data: {
          data: [
            {
              id: 'images',
              attributes: {
                ancestors: ['examples'],
                structure_family: 'array',
                structure: { shape: [256, 256] },
                metadata: {},
              },
              links: {},
              meta: null,
            },
            {
              id: 'log',
              attributes: {
                ancestors: ['examples'],
                structure_family: 'table',
                structure: { columns: ['a'] },
                metadata: {},
              },
              links: {},
              meta: null,
            },
          ],
          meta: { count: 2 },
        },
      }),
    );
    mockUseNodeMetadata.mockReturnValue({
      data: {
        id: 'examples',
        attributes: { structure_family: 'container', data_sources: [] },
      },
      isLoading: false,
    });
    renderAt('/browse/examples');

    const button = screen.getByRole('button', { name: 'View with H5Web' });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('hides empty containers when the checkbox is checked', async () => {
    const user = userEvent.setup();
    mockUseNodeSearch.mockReturnValue(
      baseResult({
        data: {
          data: [
            {
              id: 'empty',
              attributes: {
                ancestors: ['generated'],
                structure_family: 'container',
                structure: { count: 0 },
                metadata: {},
              },
              links: {},
              meta: null,
            },
            {
              id: 'sub',
              attributes: {
                ancestors: ['generated'],
                structure_family: 'container',
                structure: { count: 2 },
                metadata: {},
              },
              links: {},
              meta: null,
            },
            {
              id: 'plot',
              attributes: {
                ancestors: ['generated'],
                structure_family: 'array',
                structure: { shape: [10] },
                metadata: {},
              },
              links: {},
              meta: null,
            },
          ],
          meta: { count: 3 },
        },
      }),
    );
    renderAt('/browse/generated');

    expect(screen.getByText('empty')).toBeInTheDocument();

    // 'empty' has count 0 and the live probe confirms it has no children.
    mockUseVerifiedEmpty.mockReturnValue(new Set(['empty']));
    await user.click(screen.getByLabelText('Hide empty containers'));

    expect(screen.queryByText('empty')).not.toBeInTheDocument();
    expect(screen.getByText('sub')).toBeInTheDocument();
    expect(screen.getByText('plot')).toBeInTheDocument();
    expect(screen.getByTestId('status-line-text')).toHaveTextContent('1 empty hidden');
  });

  it('keeps a stale-count container visible when the server still serves children', async () => {
    const user = userEvent.setup();
    // All children report count 0 (under-reported), but none are confirmed empty
    // by the live probe because they actually have children.
    mockUseVerifiedEmpty.mockReturnValue(new Set());
    mockUseNodeSearch.mockReturnValue(
      baseResult({
        data: {
          data: [
            {
              id: 'probe',
              attributes: {
                ancestors: ['generated'],
                structure_family: 'container',
                structure: { count: 0 },
                metadata: {},
              },
              links: {},
              meta: null,
            },
            {
              id: 'nerve',
              attributes: {
                ancestors: ['generated'],
                structure_family: 'container',
                structure: { count: 0 },
                metadata: {},
              },
              links: {},
              meta: null,
            },
          ],
          meta: { count: 2 },
        },
      }),
    );
    renderAt('/browse/generated');

    await user.click(screen.getByLabelText('Hide empty containers'));

    expect(screen.getByText('probe')).toBeInTheDocument();
    expect(screen.getByText('nerve')).toBeInTheDocument();
    expect(screen.getByTestId('status-line-text')).toHaveTextContent('Browse /generated');
  });

  it('shows a "no non-empty containers" message when everything is filtered out', async () => {
    const user = userEvent.setup();
    mockUseNodeSearch.mockReturnValue(
      baseResult({
        data: {
          data: [
            {
              id: 'only-empty',
              attributes: {
                ancestors: ['generated'],
                structure_family: 'container',
                structure: { count: 0 },
                metadata: {},
              },
              links: {},
              meta: null,
            },
          ],
          meta: { count: 1 },
        },
      }),
    );
    renderAt('/browse/generated');

    // 'only-empty' has count 0 and the live probe confirms it has no children.
    mockUseVerifiedEmpty.mockReturnValue(new Set(['only-empty']));
    await user.click(screen.getByLabelText('Hide empty containers'));

    expect(screen.getByText('No non-empty containers')).toBeInTheDocument();
    expect(screen.queryByText('only-empty')).not.toBeInTheDocument();
  });

  it('shows the current container metadata via the Metadata toggle', async () => {
    const user = userEvent.setup();
    mockUseNodeSearch.mockReturnValue(baseResult());
    mockUseNodeMetadata.mockReturnValue({
      data: {
        id: 'generated',
        attributes: {
          structure_family: 'container',
          structure: { count: 2 },
          specs: [{ name: 'MySpec', version: '1' }],
          metadata: { sample: 'X' },
        },
        links: {},
        meta: null,
      },
      isLoading: false,
    });
    renderAt('/browse/generated');

    expect(screen.queryByText(/"sample"/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Metadata' }));

    expect(screen.getByText(/"sample"/)).toBeInTheDocument();
    expect(screen.getByText('MySpec')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Metadata' }));

    expect(screen.queryByText(/"sample"/)).not.toBeInTheDocument();
  });

  it('does not show a Metadata button at the root listing', () => {
    mockUseNodeSearch.mockReturnValue(baseResult());
    mockUseNodeMetadata.mockReturnValue({ data: undefined, isLoading: false });
    renderAt('/browse');
    expect(screen.queryByRole('button', { name: 'Metadata' })).not.toBeInTheDocument();
  });
});
