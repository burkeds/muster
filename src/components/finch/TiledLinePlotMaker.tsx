import { useState, useEffect } from 'react';
import { TiledApiClient, TiledSearchConfig, TiledSearchResult } from '@blueskyproject/tiled';
import { Shuffle, Sliders, PaintBrush } from '@phosphor-icons/react';
import { Tooltip } from 'react-tooltip';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { TiledWriterMultiScatterPlot } from './Tiled/TiledWriterMultiScatterPlot';

export interface TiledLinePlotMakerProps {
  /** Isolated Tiled API client instance. */
  tiledClient: TiledApiClient;
  /** Initial path for Tiled searches. */
  initialPath?: string;
  /** Additional CSS classes. */
  className?: string;
  /** Additional CSS classes for the plot area. */
  classNamePlot?: string;
}


interface RunStartMetadata {
  time?: number;
  sample?: string;
  sample_name?: string;
  user_metadata?: { sample_name?: string };
}

function itemLabel(meta: Record<string, unknown> | undefined, id: string): string {
  const start = meta?.start as RunStartMetadata | undefined;
  const time = start?.time;
  const datePart = time ? dayjs.unix(time).format('MM/DD') : null;
  const timePart = time ? dayjs.unix(time).format('HH:mm') : null;
  const sample = start?.sample;
  const userMeta = start?.sample_name ?? start?.user_metadata?.sample_name;

  const parts = [
    datePart,
    timePart,
    sample || userMeta || id.slice(0, 8),
  ].filter(Boolean);

  return parts.join(' · ');
}

/**
 * A tool for creating multi-trace line plots from Tiled data runs.
 * Supports searching for runs, selecting multiple runs, and configuring axes.
 */
export function TiledLinePlotMaker({
  tiledClient,
  initialPath,
  className,
  classNamePlot,
}: TiledLinePlotMakerProps) {
  const [searchResults, setSearchResults] = useState<TiledSearchResult | null>(null);
  const [blueskyIds, setBlueskyIds] = useState<string[]>([]);
  const [traceNames, setTraceNames] = useState<Record<string, string>>({});
  const [xAxis, setXAxis] = useState('seq_num');
  const [yAxis, setYAxis] = useState('time');
  const [plotTitle, setPlotTitle] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const config: TiledSearchConfig = {
          searchFilters: {
            specs: { include: ['BlueskyRun'], exclude: [] },
          },
        };
        const results = await tiledClient.getSearch(initialPath || '', config);
        setSearchResults(results);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchHistory();
  }, [tiledClient, initialPath]);

  const toggleId = (id: string) => {
    setBlueskyIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const updateTraceName = (id: string, name: string) => {
    setTraceNames((prev) => ({ ...prev, [id]: name }));
  };

  return (
    <article className={cn('flex flex-col gap-6 p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-sm', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sky-900 mb-2">
            <Sliders size={20} weight="bold" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Plot Settings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-inner">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
              <input
                value={plotTitle}
                onChange={(e) => setPlotTitle(e.target.value)}
                placeholder="Auto-generated"
                className="w-full text-sm border-b border-slate-200 focus:border-sky-500 outline-none py-1 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">X Axis</label>
              <input
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="w-full text-sm border-b border-slate-200 focus:border-sky-500 outline-none py-1 font-mono transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Y Axis</label>
              <input
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="w-full text-sm border-b border-slate-200 focus:border-sky-500 outline-none py-1 font-mono transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Picker */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sky-900 mb-2">
            <Shuffle size={20} weight="bold" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Data Picker</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 h-48">
            <div className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-inner overflow-hidden">
              <header className="px-3 py-1 bg-slate-100 border-b border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Available Runs</span>
              </header>
              <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                {searchResults?.data.map((item) => {
                  const selected = blueskyIds.includes(item.id);
                  return (
                    <li
                      key={item.id}
                      onClick={() => toggleId(item.id)}
                      data-tooltip-id="run-tooltip"
                      data-tooltip-content={JSON.stringify({
                        id: item.id,
                        ...item.attributes.metadata
                      })}
                      className={cn(
                        'text-xs px-2 py-1.5 rounded cursor-pointer transition-colors border truncate',
                        selected 
                          ? 'bg-sky-600 border-sky-700 text-white font-medium' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {itemLabel(item.attributes.metadata as Record<string, unknown>, item.id)}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-inner overflow-hidden">
              <header className="px-3 py-1 bg-slate-100 border-b border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Selected Traces</span>
              </header>
              <ul className="flex-1 overflow-y-auto p-2 space-y-2">
                {blueskyIds.map((id) => (
                  <li key={id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleId(id)}
                      className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                    <input
                      value={traceNames[id] || ''}
                      onChange={(e) => updateTraceName(id, e.target.value)}
                      placeholder={id.slice(0, 4)}
                      className="flex-1 min-w-0 text-[10px] border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-sky-500 transition-colors"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Tooltip id="run-tooltip" className="z-50 shadow-xl" />
        </section>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 text-sky-900 mb-4">
          <PaintBrush size={20} weight="bold" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Preview</h2>
        </div>
        <TiledWriterMultiScatterPlot
          tiledClient={tiledClient}
          tiledTrace={{ x: xAxis, y: yAxis }}
          blueskyRunIds={blueskyIds}
          traceNames={blueskyIds.map((id) => traceNames[id] || id.slice(0, 4))}
          title={plotTitle || undefined}
          className={cn('min-h-[400px] border border-slate-200 shadow-lg bg-white overflow-hidden rounded-xl', classNamePlot)}
          plotClassName="h-full"
          initialPath={initialPath}
        />
      </div>
    </article>
  );
}
