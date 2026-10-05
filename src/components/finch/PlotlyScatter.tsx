import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import Plot, { PlotParams } from 'react-plotly.js';
import { Layout, LayoutAxis } from 'plotly.js';
import { cn } from '@/lib/utils';

export interface PlotlyScatterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Plotly trace array to render. */
  data: PlotParams['data'];
  /** Plot title displayed above the chart. */
  title?: string;
  /** Label for the x axis. */
  xAxisTitle?: string;
  /** Label for the y axis. */
  yAxisTitle?: string;
  /** Fixed [min, max] range for the x axis. */
  xAxisRange?: [number, number];
  /** Fixed [min, max] range for the y axis. */
  yAxisRange?: [number, number];
  /** Additional Plotly xaxis layout overrides. */
  xAxisLayout?: Partial<LayoutAxis>;
  /** Additional Plotly yaxis layout overrides. */
  yAxisLayout?: Partial<LayoutAxis>;
  /** Plotly layout overrides. */
  layout?: Partial<Layout>;
  /** Plotly configuration options. */
  config?: Partial<PlotParams['config']>;
}

const titleFont = {
  size: 16,
  color: '#082f49',
};

/**
 * A Scatter/Line visualization using Plotly.
 * Handles auto-resizing and provides consistent styling for scientific plots.
 */
export const PlotlyScatter = React.memo(function PlotlyScatter({
  data = [],
  title,
  xAxisTitle,
  yAxisTitle,
  xAxisRange,
  yAxisRange,
  xAxisLayout,
  yAxisLayout,
  layout,
  className,
  config,
  ...props
}: PlotlyScatterProps) {
  const plotContainer = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    if (plotContainer.current) {
      resizeObserver.observe(plotContainer.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      className={cn('max-h-full h-96 rounded-lg overflow-hidden text-slate-700 bg-slate-50', className)}
      ref={plotContainer}
      {...props}
    >
      <Plot
        data={data}
        layout={{
          title: title ? { text: title, font: titleFont } : undefined,
          plot_bgcolor: '#ffffff',
          paper_bgcolor: '#ffffff',
          xaxis: {
            title: xAxisTitle ? { text: xAxisTitle, font: titleFont } : undefined,
            range: xAxisRange,
            ...xAxisLayout,
          },
          yaxis: {
            title: yAxisTitle ? { text: yAxisTitle, font: titleFont } : undefined,
            range: yAxisRange,
            ...yAxisLayout,
          },
          autosize: true,
          width: dimensions.width,
          height: dimensions.height,
          margin: {
            l: yAxisTitle ? 70 : 50,
            r: 30,
            t: title ? 60 : 30,
            b: xAxisTitle ? 70 : 40,
          },
          ...layout,
        }}
        config={{ responsive: true, displaylogo: false, ...config }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
});
