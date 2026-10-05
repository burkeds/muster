import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useArrayData } from './useArrayData';

const axiosGet = vi.fn();
vi.mock('@/config/useTiledClient', () => ({
  useOptionalTiledClient: () => ({
    // A proxied, root-relative base (as used for remote, non-loopback Tiled
    // servers to avoid CORS). Regression guard for a bug where this base got
    // applied twice.
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
  axiosGet.mockResolvedValue({ data: [1, 2, 3] });
});

describe('useArrayData', () => {
  it('fetches a base-relative path, not the client base doubled up', async () => {
    const { result } = renderHook(
      () => useArrayData({ segments: ['bmm', 'uid', 'primary', 'data', 'array'], slice: '0:10' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(axiosGet).toHaveBeenCalledTimes(1);
    const [url] = axiosGet.mock.calls[0] as [string];
    // The axios instance from getAxiosClient() already carries the (possibly
    // proxied) base as its own baseURL, so the url passed to .get() must not
    // embed that base again.
    expect(url.startsWith('/tiled/')).toBe(false);
    expect(url).toBe('/array/full/bmm/uid/primary/data/array?format=application%2Fjson&slice=0%3A10');
  });
});
