import { useQuery } from '@tanstack/react-query';
import { useOptionalTiledClient } from '@/config/useTiledClient';
import { arrayFullUrl } from '@/lib/tiledDownload';

export interface UseArrayDataParams {
  segments: string[];
  slice?: string;
  enabled?: boolean;
}

/**
 * Fetch an array (sliced) as a nested JSON array.
 *
 * TiledApiClient.getArrayAsJSON only expresses stack/downsample slices, so we
 * hit /array/full directly via the authenticated axios instance when a raw
 * numpy-style slice is needed (or always, for a uniform code path).
 */
export function useArrayData(params: UseArrayDataParams) {
  const client = useOptionalTiledClient();
  const { segments, slice, enabled = true } = params;

  return useQuery({
    queryKey: ['tiled', 'array', client?.getBaseUrl(), segments.join('/'), slice],
    queryFn: async () => {
      // Base is '' (not client.getBaseUrl()): the axios instance returned by
      // getAxiosClient() already has baseURL set to the (possibly proxied) base,
      // so embedding it again here would double it up for proxied/relative bases.
      const url = arrayFullUrl('', segments, {
        format: 'application/json',
        slice,
      });
      const res = await client!.getAxiosClient().get(url, {
        headers: { Accept: 'application/json' },
      });
      return res.data as unknown[];
    },
    enabled: enabled && segments.length > 0 && !!client,
  });
}
