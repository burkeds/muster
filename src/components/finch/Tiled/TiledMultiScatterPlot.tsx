import { cn } from '@/lib/utils';
import { useQueries } from '@tanstack/react-query';
import { PlotData } from 'plotly.js';
import { TiledApiClient } from '@blueskyproject/tiled';
import { PlotlyScatter } from '../PlotlyScatter';
import { TiledPlotlyTrace } from './types';

export interface TiledMultiScatterPlotProps {
  /** Isolated Tiled API client instance. */
  tiledClient: TiledApiClient;
  /** Trace descriptor mapping Plotly fields to table column names for x and y axes. */
  tiledTrace: TiledPlotlyTrace;
  /** Tiled paths to table nodes. */
  paths: (string | null)[];
  /** Table partition index to fetch. Defaults to 0. */
  partition?: number;
  /** Additional class names applied to the outer container. */
  className?: string;
  /** Additional class names applied to the plot element. */
  plotClassName?: string;
  /** Plot title. */
  title?: string;
  /** When true, uses only the first 4 characters of each path as the trace name. */
  shortPathNames?: boolean;
  /** Explicit names for each trace, parallel to paths. */
  traceNames?: string[];
  /** Message to display that overrides all other displays. */
  popupMessage?: string;
}

/**
 * Renders multiple scatter traces from Tiled table nodes.
 * Fetches data for each path using the provided TiledApiClient.
 */
export function TiledMultiScatterPlot({
  tiledClient,
  tiledTrace,
  paths,
  partition = 0,
  className,
  plotClassName,
  title,
  shortPathNames = false,
  traceNames,
  popupMessage,
}: TiledMultiScatterPlotProps) {
  const results = useQueries({
    queries: paths.map((path) => ({
      queryKey: ['tiled', 'table', tiledClient.getBaseUrl(), path ?? ''],
      queryFn: () => tiledClient.getTablePartitionAsJSON(path!, { partition }),
      enabled: path !== null,
    })),
  });

  const xName = tiledTrace.x;
  const yName = tiledTrace.y;

  const isLoading = results.some((r) => r.isLoading);
  const errors = results.filter((r) => r.error).map((r) => (r.error as Error).message);

  const mismatchedResult = !isLoading
    ? results.find((r) => r.data && (!r.data[xName] || !r.data[yName]))
    : undefined;
  const availableColumns = mismatchedResult ? Object.keys(mismatchedResult.data!) : null;

  const plotData: Partial<PlotData>[] = results.flatMap((r, i) => {
    const data = r.data;
    if (!data || !data[xName] || !data[yName]) return [];
    return [
      {
        mode: 'lines+markers',
        marker: { symbol: 'circle', size: 6 },
        ...tiledTrace,
        x: data[xName],
        y: data[yName],
        name:
          traceNames?.[i] ??
          (shortPathNames
            ? (paths[i] ?? `trace ${i}`).slice(0, 4)
            : (paths[i] ?? `trace ${i}`)),
      } as Partial<PlotData>,
    ];
  });

  return (
    <div
      className={cn(
        'flex-grow h-[30rem] rounded-lg bg-white min-w-0 shadow-sm border relative',
        className,
      )}
    >
      {popupMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 p-4">
          <p className="text-destructive font-medium">{popupMessage}</p>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75 z-10">
              <p className="text-slate-500 animate-pulse">Loading data...</p>
            </div>
          )}
          {errors.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75 z-10 p-4">
              <p className="text-destructive">Error: {errors[0]}</p>
            </div>
          )}
          {paths.every((p) => p === null) && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75 z-10">
              <p className="text-slate-500 italic">Waiting for data paths...</p>
            </div>
          )}
          {availableColumns && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 gap-2 p-4">
              <p className="text-amber-600 font-medium text-sm">
                Column not found — <span className="font-mono">x="{xName}"</span> /{' '}
                <span className="font-mono">y="{yName}"</span>
              </p>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Available columns:</p>
              <div className="flex flex-wrap gap-1 justify-center max-w-md">
                {availableColumns.map((col) => (
                  <span
                    key={col}
                    className="bg-slate-100 border border-slate-300 rounded px-2 py-0.5 text-[10px] font-mono text-slate-700"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <PlotlyScatter
        data={plotData}
        xAxisTitle={xName}
        yAxisTitle={yName}
        className={cn('h-full w-full', plotClassName)}
        title={title}
        config={{ displayModeBar: true }}
      />
    </div>
  );
}
