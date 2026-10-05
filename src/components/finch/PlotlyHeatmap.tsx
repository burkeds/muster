import * as React from 'react';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { cn } from '@/lib/utils';

export interface PlotlyHeatmapProps extends React.HTMLAttributes<HTMLDivElement> {
  /** A nested array displayed top-down */
  array: number[][];
  /** The plot title */
  title?: string;
  /** x axis title */
  xAxisTitle?: string;
  /** y axis title */
  yAxisTitle?: string;
  /** Plotly specific colorscales */
  colorScale?: string;
  /** Adjust the height of the plot. ex) a factor of 0.1 means 10 rows per pixel */
  verticalScaleFactor?: number;
  /** Should tick marks show up? */
  showTicks?: boolean;
  /** Spacing between tick marks along data */
  tickStep?: number;
  /** Should the visual plot be locked to the height of the parent container? */
  lockPlotHeightToParent?: boolean;
  /** Should each data point be locked in to an exact pixel? */
  lockPlotWidthHeightToInputArray?: boolean;
  /** Should the color scale show up? */
  showScale?: boolean;
  /** Enable log scale slider control */
  enableLogScale?: boolean;
  /** Flip y axis */
  flipYAxis?: boolean;
  /** Additional CSS classes applied to the optional controller panel. */
  classNameControls?: string;
}

/**
 * A Heatmap visualization using Plotly.
 * Supports log/gamma scaling, flipping the Y axis, and auto-resizing.
 */
export function PlotlyHeatmap({
  array,
  title = '',
  xAxisTitle = '',
  yAxisTitle = '',
  colorScale = 'Viridis',
  verticalScaleFactor = 0.1,
  showTicks = false,
  tickStep = 100,
  showScale = true,
  lockPlotHeightToParent = false,
  lockPlotWidthHeightToInputArray = false,
  enableLogScale = false,
  flipYAxis = true,
  className,
  classNameControls,
  ...props
}: PlotlyHeatmapProps) {
  const plotContainer = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scaleValue, setScaleValue] = useState<number>(0);
  const [debouncedScale, setDebouncedScale] = useState<number>(0);
  const [scaleType, setScaleType] = useState<'log' | 'gamma'>('log');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedScale(scaleValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [scaleValue]);

  const processedArray = useMemo(() => {
    if (!enableLogScale || debouncedScale === 0) {
      return array;
    }

    if (scaleType === 'log') {
      const logBase = 1 + debouncedScale / 10;
      return array.map((row) =>
        row.map((value) => {
          const safeValue = Math.max(value, 0.001);
          return Math.log(safeValue) / Math.log(logBase);
        }),
      );
    } else {
      const gamma = 0.1 + (debouncedScale / 10) * 2.9;
      let maxValue = 0;
      for (const row of array) {
        for (const value of row) {
          if (value > maxValue) {
            maxValue = value;
          }
        }
      }

      return array.map((row) =>
        row.map((value) => {
          const normalized = maxValue > 0 ? value / maxValue : 0;
          const gammaCorrected = Math.pow(normalized, gamma);
          return gammaCorrected * maxValue;
        }),
      );
    }
  }, [array, debouncedScale, enableLogScale, scaleType]);

  const handleScaleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setScaleValue(Number(event.target.value));
  }, []);

  const handleScaleTypeChange = useCallback((newType: 'log' | 'gamma') => {
    setScaleType(newType);
    setScaleValue(0);
  }, []);

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

  const dynamicHeight = Math.max(array.length * verticalScaleFactor, 0);

  return (
    <div className={cn('flex flex-col w-full h-full', className)} {...props}>
      {enableLogScale && (
        <div
          className={cn(
            'flex items-center justify-center gap-4 p-2 bg-slate-50 border-b text-xs',
            classNameControls,
          )}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScaleTypeChange('log')}
              className={cn(
                'px-2 py-1 font-medium transition-colors',
                scaleType === 'log'
                  ? 'text-sky-800 border-b border-sky-800'
                  : 'text-slate-400 hover:text-sky-800'
              )}
            >
              Log Scale
            </button>
            <button
              type="button"
              onClick={() => handleScaleTypeChange('gamma')}
              className={cn(
                'px-2 py-1 font-medium transition-colors',
                scaleType === 'gamma'
                  ? 'text-sky-800 border-b border-sky-800'
                  : 'text-slate-400 hover:text-sky-800'
              )}
            >
              Gamma Scale
            </button>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-48">
            <span className="text-gray-500">Off</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={scaleValue}
              onChange={handleScaleChange}
              className="flex-1"
            />
            <span className="text-gray-500">Max</span>
          </div>
          <div className="min-w-[2rem] text-sky-800 font-mono">
            {scaleValue > 0 ? scaleValue.toFixed(1) : ''}
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 relative" ref={plotContainer}>
        <Plot
          data={[
            {
              z: processedArray,
              type: 'heatmap',
              colorscale: colorScale,
              showscale: showScale,
            },
          ]}
          layout={{
            title: title ? { text: title } : undefined,
            xaxis: {
              title: xAxisTitle,
              showticklabels: showTicks,
              showgrid: showTicks,
            },
            yaxis: {
              title: yAxisTitle,
              autorange: flipYAxis ? 'reversed' : undefined,
              showticklabels: showTicks,
              showgrid: showTicks,
              tickmode: showTicks ? 'linear' : undefined,
              dtick: showTicks ? tickStep : undefined,
            },
            autosize: true,
            width: lockPlotWidthHeightToInputArray && array[0]
              ? Math.min(dimensions.width, array[0].length)
              : dimensions.width,
            height: lockPlotWidthHeightToInputArray
              ? Math.min(dimensions.height, array.length)
              : lockPlotHeightToParent
                ? dimensions.height
                : dynamicHeight,
            margin: {
              l: showTicks || yAxisTitle ? 50 : 20,
              r: 20,
              t: title ? 50 : 20,
              b: xAxisTitle ? 50 : 20,
            },
          }}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
