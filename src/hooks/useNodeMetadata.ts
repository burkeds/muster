import { useQuery } from '@tanstack/react-query';
import { useOptionalTiledClient } from '@/config/useTiledClient';
import type { NodeMetadata } from '@/lib/tiledTypes';

export interface UseNodeMetadataParams {
  segments: string[];
  /**
   * Field selection is not exposed by TiledApiClient.getMetadata.
   * Kept for call-site compatibility; ignored by the request.
   */
  fields?: string[];
  /**
   * include_data_sources is not exposed by TiledApiClient.getMetadata options.
   * Kept for call-site compatibility; ignored by the request.
   */
  includeDataSources?: boolean;
  enabled?: boolean;
}

/** React-query hook for GET /metadata/{segments} via TiledApiClient.getMetadata. */
export function useNodeMetadata(params: UseNodeMetadataParams) {
  const client = useOptionalTiledClient();
  const { segments, fields, includeDataSources = false, enabled = true } = params;

  return useQuery({
    queryKey: [
      'tiled',
      'metadata',
      client?.getBaseUrl(),
      segments.join('/'),
      fields,
      includeDataSources,
    ],
    queryFn: async (): Promise<NodeMetadata> => {
      // pathMode absolute: segments are full paths from the catalog root.
      const item = await client!.getMetadata(segments.join('/'), { pathMode: 'absolute' });
      return item as NodeMetadata;
    },
    enabled: enabled && segments.length > 0 && !!client,
  });
}
