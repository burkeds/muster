import { useCallback, useEffect, useState, useRef } from 'react';
import { TiledApiClient } from '@blueskyproject/tiled';
import { PlotlyHeatmap } from './PlotlyHeatmap';
import { cn } from '@/lib/utils';

export interface PlotlyHeatmapTiledProps {
  /** Isolated Tiled API client instance. */
  tiledClient: TiledApiClient;
  /** Tiled path to the array (e.g. "my_image"). Pass null to show a placeholder. */
  path: string | null;
  /** Additional CSS classes. */
  className?: string;
  /** Controls dimensions. */
  size?: 'small' | 'medium' | 'large';
  /** Periodic polling to detect shape changes (e.g. new frames). */
  enablePolling?: boolean;
  /** Polling interval in ms. */
  pollingIntervalMs?: number;
}

/**
 * A Tiled-backed heatmap that fetches data from a scientific server.
 * Supports 2D and 3D arrays (with a frame scrubber for 3D).
 */
export function PlotlyHeatmapTiled({
  tiledClient,
  path,
  className,
  size = 'medium',
  enablePolling = false,
  pollingIntervalMs = 2000,
}: PlotlyHeatmapTiledProps) {
  const [array, setArray] = useState<number[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliderIndex, setSliderIndex] = useState<number>(0);
  const [shape, setShape] = useState<number[] | null>(null);
  const [userHasMovedSlider, setUserHasMovedSlider] = useState<boolean>(false);
  const initialSliderPosition = useRef<number>(0);

  const sizeClassMap = {
    small: 'w-[400px] h-[500px]',
    medium: 'w-[700px] h-[800px]',
    large: 'w-[1000px] h-[1200px]',
  };

  const fetchFrame = useCallback(
    async (frameIndex: number, currentPath: string, currentShape: number[]) => {
      try {
        setError(null);
        // For 3D [frames, height, width], we stack on axis 0.
        // For 2D [height, width], we don't need a stack.
        const options = currentShape.length === 3 ? { stack: [frameIndex] } : {};

        const data = await tiledClient.getArrayAsJSON<number[][]>(currentPath, options);
        setArray(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Failed to load data: ${msg}`);
        setArray(null);
      }
    },
    [tiledClient],
  );

  useEffect(() => {
    if (!path) {
      setError(null);
      setShape(null);
      setSliderIndex(0);
      setArray(null);
      setUserHasMovedSlider(false);
      return;
    }

    const loadMetadata = async () => {
      try {
        const item = await tiledClient.getMetadata(path);
        const structure = item.attributes.structure;
        
        if (structure && 'shape' in structure) {
          const newShape = structure.shape as number[];
          setShape(newShape);
          
          // Start at frame 0 (or last frame if preferred, but Finch starts at 0)
          setSliderIndex(0);
          setUserHasMovedSlider(false);
          initialSliderPosition.current = 0;
          
          await fetchFrame(0, path, newShape);
        } else {
          throw new Error('Item is not an array or has no shape');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Failed to load metadata: ${msg}`);
        setArray(null);
      }
    };

    loadMetadata();
  }, [path, tiledClient, fetchFrame]);

  // Polling for live updates
  useEffect(() => {
    if (!enablePolling || !path) return;

    const poll = async () => {
      try {
        const item = await tiledClient.getMetadata(path);
        const structure = item.attributes.structure;
        const newShape = structure && 'shape' in structure ? (structure.shape as number[]) : null;

        if (newShape && shape) {
          const shapeChanged = 
            newShape.length !== shape.length || 
            (newShape.length === 3 && newShape[0] !== shape[0]);

          if (shapeChanged) {
            setShape(newShape);
            
            // Auto-advance if user hasn't touched the slider
            if (!userHasMovedSlider) {
              const latestFrame = newShape.length === 3 ? newShape[0] - 1 : 0;
              setSliderIndex(latestFrame);
              initialSliderPosition.current = latestFrame;
              await fetchFrame(latestFrame, path, newShape);
            }
          }
        }
      } catch (err) {
        console.warn('[PlotlyHeatmapTiled] Polling error:', err);
      }
    };

    const interval = setInterval(poll, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [enablePolling, path, tiledClient, shape, userHasMovedSlider, pollingIntervalMs, fetchFrame]);

  return (
    <section
      className={cn(
        'flex flex-col items-center gap-4 max-h-full max-w-full p-4 rounded-md shadow-sm border bg-white',
        !path && 'opacity-70',
        error && 'border-destructive bg-destructive/10',
        sizeClassMap[size],
        className
      )}
    >
      {(error || !path) && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-2xl font-semibold mb-4">Tiled Heatmap</h2>
          <p className="text-muted-foreground italic">
            {path ? `Path: ${path}` : 'No data path provided'}
          </p>
          {error && <p className="text-destructive mt-4">{error}</p>}
        </div>
      )}

      {array && (
        <>
          <h3 className="text-sm font-medium text-slate-500 w-full truncate text-center">
            {path}
          </h3>
          <div className="flex-1 w-full min-h-0">
            <PlotlyHeatmap
              array={array}
              lockPlotHeightToParent={true}
              enableLogScale={true}
              colorScale="Viridis"
              flipYAxis={true}
            />
          </div>
        </>
      )}

      {shape && shape.length === 3 && shape[0] > 1 && (
        <div className="w-full flex flex-col gap-1 px-2">
          <input
            type="range"
            min={0}
            max={shape[0] - 1}
            value={sliderIndex}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSliderIndex(val);
              setUserHasMovedSlider(true);
              if (path) fetchFrame(val, path, shape);
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Slice {sliderIndex}</span>
            {enablePolling && !userHasMovedSlider && (
              <span className="text-sky-600 animate-pulse">Live</span>
            )}
            <span>Max {shape[0] - 1}</span>
          </div>
        </div>
      )}
    </section>
  );
}
