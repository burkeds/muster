import { useState, type ReactNode } from 'react';
import type { ArrayStructure, NodeResponse } from '@tiled/client-core';
import { useArrayData } from '@/hooks/useArrayData';
import { PlotlyPlot } from '@/lib/plot';
import { PlotCard } from '@/components/viz/PlotCard';
import { VizTypePicker } from '@/components/viz/VizTypePicker';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { SliceForm } from './SliceForm';
import { firstFrameControls, to2D } from './slice';

export interface ArrayViewProps {
  segments: string[];
  metadata: NodeResponse;
}

/** Rendering options (line/scatter/bar) for 1-D arrays. */
const ARRAY_1D_VIEWS = ['Line', 'Scatter', 'Bar'] as const;
/** Rendering options for 2-D blocks. */
const ARRAY_2D_VIEWS = ['Heatmap', 'Contour', 'Surface'] as const;

/** Primary view for an array node, offering visualization options per ndim. */
export function ArrayView({ segments, metadata }: ArrayViewProps) {
  const structure = metadata.data?.attributes?.structure as ArrayStructure | undefined;
  const shape = structure?.shape ?? [];
  const itemsize = structure?.data_type?.itemsize ?? 1;
  const filename = metadata.data?.id ?? 'array';

  if (shape.length === 0) {
    return <StateMessage kind="empty" title="No shape information" />;
  }
  if (shape.length === 1) {
    return <Array1DViz segments={segments} shape={shape} itemsize={itemsize} filename={filename} />;
  }
  return <Array2DViz segments={segments} shape={shape} itemsize={itemsize} filename={filename} />;
}

interface GatedProps {
  ndim: number;
  shape: number[];
  itemsize: number;
  segments: string[];
  status: (slice: string | undefined) => string;
  render: (data: unknown[], slice: string | undefined) => ReactNode;
}

/**
 * Prompts for a slice (or the whole array) and only fetches data once the user
 * submits a choice; otherwise no request is sent to the server.
 */
function SliceGated({ ndim, shape, itemsize, segments, status, render }: GatedProps) {
  const [submitted, setSubmitted] = useState<{ slice?: string } | null>(null);
  const slice = submitted?.slice;
  const query = useArrayData({ segments, slice, enabled: submitted !== null });

  return (
    <div className="flex flex-col gap-3">
      <StatusLine text={status(slice)} />
      <SliceForm
        ndim={ndim}
        shape={shape}
        itemsize={itemsize}
        defaultControls={ndim > 2 ? firstFrameControls(ndim) : undefined}
        onSubmit={(s) => setSubmitted({ slice: s })}
      />
      {submitted === null ? (
        <StateMessage
          kind="empty"
          title="Request a slice"
          description="Choose a slice above (or the entire array) to load the data."
        />
      ) : query.isError ? (
        <StateMessage kind="error" title="Failed to load array" />
      ) : query.isLoading ? (
        <StateMessage kind="loading" title="Loading array…" />
      ) : (
        render(query.data ?? [], slice)
      )}
    </div>
  );
}

function Array1DViz({
  segments,
  shape,
  itemsize,
  filename,
}: {
  segments: string[];
  shape: number[];
  itemsize: number;
  filename: string;
}) {
  return (
    <SliceGated
      ndim={1}
      shape={shape}
      itemsize={itemsize}
      segments={segments}
      status={(slice) => `Array · shape [${shape.join(', ')}]${slice ? ` · slice ${slice}` : ''}`}
      render={(data, slice) => <Array1DPlot segments={segments} filename={filename} data={data} slice={slice} />}
    />
  );
}

function Array1DPlot({
  filename,
  data,
}: {
  segments: string[];
  filename: string;
  data: unknown[];
  slice: string | undefined;
}) {
  const [view, setView] = useState<string>('Line');
  const [gd, setGd] = useState<HTMLDivElement | null>(null);
  const y = (data as number[]) ?? [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <VizTypePicker options={[...ARRAY_1D_VIEWS]} value={view} onChange={setView} />
      </div>
      <PlotCard title={filename} label={view} gd={gd} filename={filename}>
        <PlotlyPlot
          onInitialized={setGd}
          height={340}
          data={[
            {
              x: y.map((_, i) => i),
              y,
              type: (view === 'Scatter' ? 'scatter' : view === 'Bar' ? 'bar' : 'scatter') as
                | 'scatter'
                | 'bar',
              mode: view === 'Scatter' ? 'markers' : 'lines',
            },
          ]}
        />
      </PlotCard>
    </div>
  );
}

function Array2DViz({
  segments,
  shape,
  itemsize,
  filename,
}: {
  segments: string[];
  shape: number[];
  itemsize: number;
  filename: string;
}) {
  return (
    <SliceGated
      ndim={shape.length}
      shape={shape}
      itemsize={itemsize}
      segments={segments}
      status={(slice) => `Array · shape [${shape.join(', ')}]${slice ? ` · slice ${slice}` : ''}`}
      render={(data, slice) => <Array2DPlot filename={filename} data={data} slice={slice} />}
    />
  );
}

function Array2DPlot({
  filename,
  data,
  slice,
}: {
  filename: string;
  data: unknown[];
  slice: string | undefined;
}) {
  const [view, setView] = useState<string>('Heatmap');
  const [gd, setGd] = useState<HTMLDivElement | null>(null);
  const z = to2D(data) as number[][];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <VizTypePicker options={[...ARRAY_2D_VIEWS]} value={view} onChange={setView} />
      </div>
      <PlotCard
        title={filename}
        label={`${view}${slice ? ` · ${slice}` : ''}`}
        gd={gd}
        filename={filename}
      >
        <PlotlyPlot
          onInitialized={setGd}
          height={360}
          data={[
            {
              z,
              type: (view === 'Contour' ? 'contour' : view === 'Surface' ? 'surface' : 'heatmap') as
                | 'heatmap'
                | 'contour'
                | 'surface',
              colorscale: 'Viridis',
            },
          ]}
        />
      </PlotCard>
    </div>
  );
}
