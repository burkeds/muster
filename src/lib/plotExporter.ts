import { toImage } from 'plotly.js';

export type PlotExportFormat = 'png' | 'svg';

export interface PlotExportOptions {
  /** Output scale (multiples of the rendered dimensions). PNG only. */
  scale?: number;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 540;

/** Render the current plotly figure (the `gd` graph div) into an image blob. */
export async function renderPlot(
  gd: HTMLDivElement,
  format: PlotExportFormat,
  opts: PlotExportOptions = {},
): Promise<Blob> {
  const dataUrl = await toImage(gd, {
    format,
    width: opts.width ?? gd?.clientWidth ?? DEFAULT_WIDTH,
    height: opts.height ?? (gd?.clientHeight ? gd.clientHeight - 0 : DEFAULT_HEIGHT),
    scale: opts.scale ?? (format === 'png' ? 2 : 1),
  });
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error(`Failed to rasterize plot (${res.status})`);
  return res.blob();
}

/** Download the rendered plot as a PNG/SVG file. */
export async function downloadPlot(
  gd: HTMLDivElement,
  filename: string,
  format: PlotExportFormat,
  opts: PlotExportOptions = {},
): Promise<void> {
  const blob = await renderPlot(gd, format, opts);
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}
