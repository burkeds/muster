import { useQuery } from '@tanstack/react-query';
import { useOptionalTiledClient } from '@/config/useTiledClient';
import type { EntryField } from '@tiled/client-core';

export interface UseNodeMetadataParams {
  segments: string[];
  fields?: EntryField[];
  /** Pass ?include_data_sources=true so the server populates data_sources. */
  includeDataSources?: boolean;
  enabled?: boolean;
}

/** React-query hook for GET /metadata/{segments}. */
export function useNodeMetadata(params: UseNodeMetadataParams) {
  const client = useOptionalTiledClient();
  const { segments, fields, includeDataSources = false, enabled = true } = params;

  return useQuery({
    queryKey: [
      'tiled',
      'metadata',
      client?.baseUrl,
      segments.join('/'),
      fields,
      includeDataSources,
    ],
    queryFn: () => client!.metadata(segments, fields, includeDataSources),
    enabled: enabled && segments.length > 0 && !!client,
  });
}
