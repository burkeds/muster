import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';

export interface PlotlyPlotProps {
  data: Data[];
  layout?: Partial<Layout>;
  className?: string;
  height?: number;
  /** Called once the plot is drawn, receiving the plotly graph div (`gd`). */
  onInitialized?: (gd: HTMLDivElement) => void;
}

/**
 * Thin wrapper around react-plotly.js so views share styling and tests can mock
 * a single module. The `gd` graph div surfaced via onInitialized lets code
 * export the rendered figure through Plotly.toImage.
 */
export function PlotlyPlot({ data, layout, height = 360, onInitialized }: PlotlyPlotProps) {
  const merged: Partial<Layout> = {
    autosize: true,
    margin: { l: 50, r: 20, t: 30, b: 50 },
    ...layout,
  };
  return (
    <Plot
      data={data}
      layout={merged}
      useResizeHandler
      style={{ width: '100%', height }}
      config={{ responsive: true, displaylogo: false }}
      onInitialized={(_figure, graphDiv) => onInitialized?.(graphDiv as HTMLDivElement)}
    />
  );
}
