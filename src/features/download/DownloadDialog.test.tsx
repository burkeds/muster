import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/useServerInfo', () => ({
  useServerInfo: () => ({
    data: { formats: { container: ['application/x-hdf5', 'application/json'] } },
  }),
}));

import { DownloadDialog } from './DownloadDialog';
import { TiledConfigProvider } from '@/config/TiledConfigProvider';
import type { NodeResponse } from '@tiled/client-core';

const containerMeta = {
  data: { attributes: { structure_family: 'container' } },
} as unknown as NodeResponse;

afterEach(() => {
  vi.restoreAllMocks();
});

const renderOpen = () =>
  render(
    <TiledConfigProvider config={{ tiledApiUrl: 'http://localhost:8000/api/v1' }}>
      <DownloadDialog
        open
        onOpenChange={vi.fn()}
        segments={['examples']}
        metadata={containerMeta}
      />
    </TiledConfigProvider>,
  );

describe('DownloadDialog (container)', () => {
  it('defaults the format to application/json', () => {
    renderOpen();
    expect(screen.getByRole('combobox')).toHaveTextContent('application/json');
  });

  it('surfaces the server detail when a format cannot represent the container', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 406,
      json: async () => ({
        detail: 'Metadata contains types or structure that does not fit into HDF5.',
      }),
    } as Response);
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
