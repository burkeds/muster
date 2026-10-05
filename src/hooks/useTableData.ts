import { useQuery } from '@tanstack/react-query';
import { useOptionalTiledClient } from '@/config/useTiledClient';
import { tableFullUrl, tablePartitionUrl } from '@/lib/tiledDownload';

export interface UseTableDataParams {
  segments: string[];
  partition?: number;
  columns?: string[];
  enabled?: boolean;
}

/** Columnar JSON table shape: { col: values[] }. */
export type TableJSON = Record<string, (number | string | boolean | null)[]>;

/** Fetch one table partition as columnar JSON. */
export function useTableData(params: UseTableDataParams) {
  const client = useOptionalTiledClient();
  const { segments, partition = 0, columns, enabled = true } = params;

  return useQuery({
    queryKey: ['tiled', 'table', client?.getBaseUrl(), segments.join('/'), partition, columns],
    queryFn: async (): Promise<TableJSON> => {
      // Prefer SDK when no column subset is needed; otherwise use axios so we
      // can pass the repeated `column` query params the REST API expects.
      if (!columns?.length) {
        return (await client!.getTablePartitionAsJSON(segments.join('/'), {
          partition,
          pathMode: 'absolute',
        })) as TableJSON;
      }
      // Base is '' (not client.getBaseUrl()): the axios instance returned by
      // getAxiosClient() already has baseURL set to the (possibly proxied) base,
      // so embedding it again here would double it up for proxied/relative bases.
      const url = tablePartitionUrl('', segments, {
        partition,
        format: 'application/json',
        column: columns,
      });
      const res = await client!.getAxiosClient().get(url, {
        headers: { Accept: 'application/json' },
      });
      return res.data as TableJSON;
    },
    enabled: enabled && segments.length > 0 && !!client,
  });
}

/** Fetch a whole table as JSON-seq row objects. */
export function useTableSeq(params: { segments: string[]; enabled?: boolean }) {
  const client = useOptionalTiledClient();
  const { segments, enabled = true } = params;

  return useQuery({
    queryKey: ['tiled', 'table-seq', client?.getBaseUrl(), segments.join('/')],
    queryFn: () =>
      client!.getTableFullAsJSONSequence(segments.join('/'), { pathMode: 'absolute' }),
    enabled: enabled && segments.length > 0 && !!client,
  });
}

// Re-export URL helper for any caller that still builds table URLs.
export { tableFullUrl };
