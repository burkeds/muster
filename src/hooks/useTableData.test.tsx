import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTableData } from './useTableData';

const axiosGet = vi.fn();
vi.mock('@/config/useTiledClient', () => ({
  useOptionalTiledClient: () => ({
    // A proxied, root-relative base (as used for remote, non-loopback Tiled
    // servers — e.g. the public NSLS-II demo — to avoid CORS). Regression
    // guard for a bug where this base got applied twice.
    getBaseUrl: () => '/tiled/tiled-demo.nsls2.bnl.gov/api/v1',
    getAxiosClient: () => ({ get: axiosGet }),
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  axiosGet.mockReset();
  axiosGet.mockResolvedValue({ data: { seq_num: [1, 2] } });
});

describe('useTableData', () => {
  it('fetches a base-relative path, not the client base doubled up', async () => {
    const { result } = renderHook(
      () =>
        useTableData({
          segments: ['bmm', 'uid', 'primary', 'internal'],
          columns: ['seq_num'],
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(axiosGet).toHaveBeenCalledTimes(1);
    const [url] = axiosGet.mock.calls[0] as [string];
    // The axios instance from getAxiosClient() already carries the (possibly
    // proxied) base as its own baseURL, so the url passed to .get() must not
    // embed that base again.
    expect(url.startsWith('/tiled/')).toBe(false);
    expect(url).toBe(
      '/table/partition/bmm/uid/primary/internal?partition=0&format=application%2Fjson&column=seq_num',
    );
  });
});
