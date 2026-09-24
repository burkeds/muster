import { useQuery } from '@tanstack/react-query';
import { useOptionalTiledClient } from '@/config/useTiledClient';

export interface UseTableDataParams {
  segments: string[];
  partition?: number;
  columns?: string[];
  enabled?: boolean;
}

/** Fetch one table partition as columnar JSON. */
export function useTableData(params: UseTableDataParams) {
  const client = useOptionalTiledClient();
  const { segments, partition = 0, columns, enabled = true } = params;

  return useQuery({
    queryKey: ['tiled', 'table', client?.baseUrl, segments.join('/'), partition, columns],
    queryFn: () => client!.fetchTableJson(segments, partition, columns),
    enabled: enabled && segments.length > 0 && !!client,
  });
}

/** Fetch a whole table as JSON-seq row objects. */
export function useTableSeq(params: { segments: string[]; enabled?: boolean }) {
  const client = useOptionalTiledClient();
  const { segments, enabled = true } = params;

  return useQuery({
    queryKey: ['tiled', 'table-seq', client?.baseUrl, segments.join('/')],
    queryFn: () => client!.fetchTableSeq(segments),
    enabled: enabled && segments.length > 0 && !!client,
  });
}
