import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';
import { resolvePlotLayout } from '@/lib/plotTheme';
import { useOptionalPlotScheme } from '@/lib/usePlotScheme';

export interface PlotlyPlotProps {
  data: Data[];
  layout?: Partial<Layout>;
  className?: string;
  height?: number;
  /** Called once the plot is drawn, receiving the plotly graph div (`gd`). */
  onInitialized?: (gd: HTMLDivElement) => void;
}

/** Shallow-merge the theme's layout with the caller's, caller winning per key. */
function mergeLayout(theme: Partial<Layout>, caller: Partial<Layout>): Partial<Layout> {
  const out: Record<string, unknown> = { ...theme, ...caller };
  for (const key of ['xaxis', 'yaxis']) {
    const themeVal = theme?.[key as keyof Layout] as object | undefined;
    const callerVal = caller?.[key as keyof Layout] as object | undefined;
    if (themeVal && callerVal) {
      out[key] = { ...themeVal, ...callerVal };
    }
  }
  return out as Partial<Layout>;
}

/**
 * Thin wrapper around react-plotly.js so views share styling and tests can mock
 * a single module. The `gd` graph div surfaced via onInitialized lets code
 * export the rendered figure through Plotly.toImage.
 *
 * The plot is themed from the app's display settings (light/dark background,
 * font and CVD-safe colorway by default); callers can still override any
 * layout option via the `layout` prop.
 */
export function PlotlyPlot({ data, layout, height = 360, onInitialized }: PlotlyPlotProps) {
  const scheme = useOptionalPlotScheme();
  const themeLayout = resolvePlotLayout(scheme.resolved);
  const merged: Partial<Layout> = mergeLayout(themeLayout, {
    autosize: true,
    margin: { l: 50, r: 20, t: 30, b: 50 },
    ...layout,
  });
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
