import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/useServerInfo', () => ({
  useServerInfo: () => ({
    data: { formats: { container: ['application/x-hdf5', 'application/json'] } },
  }),
}));

const axiosGet = vi.fn();
vi.mock('@/config/useTiledClient', () => ({
  useOptionalTiledClient: () => ({
    getBaseUrl: () => 'http://localhost:8000/api/v1',
    getAxiosClient: () => ({ get: axiosGet }),
  }),
}));

import { DownloadDialog } from './DownloadDialog';

const containerMeta = {
  attributes: { structure_family: 'container' as const },
};

afterEach(() => {
  axiosGet.mockReset();
});

const renderOpen = () =>
  render(
    <DownloadDialog
      open
      onOpenChange={vi.fn()}
      segments={['examples']}
      metadata={containerMeta}
    />,
  );

describe('DownloadDialog (container)', () => {
  it('defaults the format to application/json', () => {
    renderOpen();
    expect(screen.getByRole('combobox')).toHaveTextContent('application/json');
  });

  it('surfaces the server detail when a format cannot represent the container', async () => {
    const user = userEvent.setup();
    const blob = new Blob(
      [JSON.stringify({ detail: 'Metadata contains types or structure that does not fit into HDF5.' })],
      { type: 'application/json' },
    );
    axiosGet.mockRejectedValue({
      response: { status: 406, data: blob },
      message: 'Request failed',
    });

    renderOpen();

    await user.click(screen.getByRole('button', { name: /Download/ }));
    expect(
      await screen.findByText(/Metadata contains types or structure that does not fit into HDF5/),
    ).toBeInTheDocument();
  });

  it('shows a note about container HDF5 limitations', () => {
    renderOpen();
    expect(screen.getByText(/container export to HDF5 only works/)).toBeInTheDocument();
  });
});
