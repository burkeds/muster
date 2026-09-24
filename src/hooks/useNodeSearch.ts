import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useOptionalTiledClient } from '@/config/useTiledClient';
import type { SearchOptions } from '@tiled/client-core';

export interface UseNodeSearchParams extends SearchOptions {
  segments: string[];
  /** When set, follow this server-provided cursor URL instead of building one. */
  cursorUrl?: string;
  enabled?: boolean;
}

/**
 * React-query hook for GET /search/{segments}.
 * Query key namespaced ['tiled','search',base,path,opts].
 */
export function useNodeSearch(params: UseNodeSearchParams) {
  const client = useOptionalTiledClient();
  const { cursorUrl, segments, enabled = true, ...options } = params;

  const key = [
    'tiled',
    'search',
    client?.baseUrl,
    segments.join('/'),
    options.pageOffset ?? 0,
    options.pageLimit ?? 100,
    options.filter ?? {},
  ];

  return useQuery({
    queryKey: key,
    queryFn: () => (cursorUrl ? client!.searchByUrl(cursorUrl) : client!.search(segments, options)),
    enabled: enabled && !!client,
    placeholderData: keepPreviousData,
  });
}
