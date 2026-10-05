import { TiledApiClient } from '@blueskyproject/tiled';
import { TiledPlotlyTrace } from './types';
import { useTiledWriterMultiScatterPlot } from './hooks/useTiledWriterMultiScatterPlot';
import { TiledMultiScatterPlot } from './TiledMultiScatterPlot';

export interface TiledWriterMultiScatterPlotProps {
  /** Isolated Tiled API client instance. */
  tiledClient: TiledApiClient;
  /** Trace descriptor mapping Plotly fields to table column names for x and y axes. */
  tiledTrace: TiledPlotlyTrace;
  /** Bluesky run UIDs used to locate the primary stream data in Tiled. */
  blueskyRunIds: string[];
  /** Initial path for the Tiled search. */
  initialPath?: string;
  /** Additional class names. */
  className?: string;
  /** Additional class names applied to the plot. */
  plotClassName?: string;
  /** Title for the plot. */
  title?: string;
  /** Explicit legend names for each trace. */
  traceNames?: string[];
}

/**
 * A wrapper that resolves Bluesky run IDs to Tiled paths and renders a multi-trace scatter plot.
 */
export function TiledWriterMultiScatterPlot({
  tiledClient,
  tiledTrace,
  blueskyRunIds,
  initialPath,
  className,
  plotClassName,
  title,
  traceNames,
}: TiledWriterMultiScatterPlotProps) {
  const { tiledPaths, isLoading, errors } = useTiledWriterMultiScatterPlot(tiledClient, blueskyRunIds, {
    initialPath,
  });

  const errorMessage = isLoading
    ? undefined
    : errors.length > 0
      ? `Error fetching data from Tiled server`
      : undefined;

  return (
    <TiledMultiScatterPlot
      tiledClient={tiledClient}
      paths={tiledPaths}
      tiledTrace={tiledTrace}
      className={className}
      plotClassName={plotClassName}
      title={title}
      shortPathNames={!traceNames}
      traceNames={traceNames}
      popupMessage={errorMessage}
    />
  );
}
