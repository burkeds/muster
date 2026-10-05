import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { TiledSearchConfig, TiledSearchFilters, TiledSearchOptions } from '@blueskyproject/tiled';
import { useOptionalTiledClient } from '@/config/useTiledClient';

export type { TiledSearchFilters, TiledSearchOptions };

export interface UseNodeSearchParams extends TiledSearchOptions {
  segments: string[];
  /** Search filters (AND-combined). */
  filter?: TiledSearchFilters;
  /**
   * @deprecated Cursor-URL follow-through is not supported by TiledApiClient.
   * Callers should pass pageOffset/pageLimit instead. Kept for API compatibility;
   * ignored when set.
   */
  cursorUrl?: string;
  enabled?: boolean;
}

/**
 * React-query hook for GET /search/{segments} via TiledApiClient.getSearch.
 * Query key namespaced ['tiled','search',base,path,opts].
 */
export function useNodeSearch(params: UseNodeSearchParams) {
  const client = useOptionalTiledClient();
  const {
    cursorUrl: _cursorUrl,
    segments,
    enabled = true,
    filter,
    fields,
    selectMetadata,
    pageOffset,
    pageLimit,
    sort,
    omitLinks,
    includeDataSources,
  } = params;

  const searchOptions: TiledSearchOptions = {
    fields,
    selectMetadata,
    pageOffset,
    pageLimit,
    sort,
    omitLinks,
    includeDataSources,
  };

  const key = [
    'tiled',
    'search',
    client?.getBaseUrl(),
    segments.join('/'),
    pageOffset ?? 0,
    pageLimit ?? 100,
    filter ?? {},
    fields,
  ];

  return useQuery({
    queryKey: key,
    queryFn: () => {
      const config: TiledSearchConfig = {
        searchFilters: filter,
        searchOptions,
      };
      // pathMode absolute: segments are full paths from the catalog root.
      return client!.getSearch(segments.join('/'), config, { pathMode: 'absolute' });
    },
    enabled: enabled && !!client,
    placeholderData: keepPreviousData,
  });
}
