import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { TiledApiClient } from '@blueskyproject/tiled';
import { cleanTiledInitialPath } from '../utils/tiledUtils';

export interface UseTiledWriterMultiScatterPlotReturn {
  /** Resolved Tiled paths, one per run ID. */
  tiledPaths: (string | null)[];
  /** True while any path is still being resolved. */
  isLoading: boolean;
  /** Per-run error/status messages. */
  errors: (string | null)[];
}

export interface UseTiledWriterMultiScatterPlotOptions {
  /** The initial path to use for the Tiled search, e.g. 'beamline531'. */
  initialPath?: string;
}

/**
 * Hook to resolve multiple Bluesky run IDs to Tiled internal data paths.
 */
export const useTiledWriterMultiScatterPlot = (
  tiledClient: TiledApiClient,
  blueskyRunIds: string[],
  options: UseTiledWriterMultiScatterPlotOptions = {},
): UseTiledWriterMultiScatterPlotReturn => {
  const startPath = options.initialPath ? `${cleanTiledInitialPath(options.initialPath)}/` : '';

  const primaryQueries = useQueries({
    queries: blueskyRunIds.map((id) => ({
      queryKey: ['tiled', 'searchById', tiledClient.getBaseUrl(), `${startPath}${id}/primary`],
      queryFn: async () => {
        try {
          return await tiledClient.getSearch(`${startPath}${id}/primary`);
        } catch {
          return null;
        }
      },
      enabled: !!id?.trim(),
      retry: false,
    })),
  });

  const tiledPaths = useMemo(
    () =>
      blueskyRunIds.map((id, i) => {
        const primaryFound = primaryQueries[i]?.isSuccess && !!primaryQueries[i]?.data;
        return primaryFound ? `${startPath}${id}/primary/internal` : null;
      }),
    [blueskyRunIds, primaryQueries, startPath],
  );

  const isLoading = primaryQueries.some((q) => q.isLoading);

  const errors = useMemo(() => {
    const perRun = blueskyRunIds.map((id, i) => {
      if (tiledPaths[i]) return null;
      if (!id?.trim()) return 'No run ID provided';
      return `No data path found for run ${id}`;
    });
    return perRun.every((e) => e === null) ? [] : perRun;
  }, [blueskyRunIds, tiledPaths]);

  return { tiledPaths, isLoading, errors };
};
