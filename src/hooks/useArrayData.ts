import { useQuery } from '@tanstack/react-query';
import { useOptionalTiledClient } from '@/config/useTiledClient';

export interface UseArrayDataParams {
  segments: string[];
  slice?: string;
  enabled?: boolean;
}

/** Fetch an array (sliced) as a nested JSON array. */
export function useArrayData(params: UseArrayDataParams) {
  const client = useOptionalTiledClient();
  const { segments, slice, enabled = true } = params;

  return useQuery({
    queryKey: ['tiled', 'array', client?.baseUrl, segments.join('/'), slice],
    queryFn: () => client!.fetchArrayJson(segments, { slice }),
    enabled: enabled && segments.length > 0 && !!client,
  });
}
