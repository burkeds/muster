import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadPlot } from '@/lib/plotExporter';
import { Download } from 'lucide-react';

export interface PlotExportMenuProps {
  /** The plotly graph <div> to rasterize. */
  gd: HTMLDivElement | null;
  /** Base filename (extension is derived from the chosen format). */
  filename: string;
}

/**
 * Dropdown that downloads the rendered plot as PNG or SVG, using plotly's
 * client-side rasteriser so the export matches what the user sees.
 */
export function PlotExportMenu({ gd, filename }: PlotExportMenuProps) {
  const [busy, setBusy] = useState(false);

  const doExport = async (format: 'png' | 'svg') => {
    if (!gd || busy) return;
    setBusy(true);
    try {
      await downloadPlot(gd, `${filename}.${format}`, format);
    } catch (err) {
      console.error('Plot export failed:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={!gd || busy}>
          <Download />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Download plot</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={busy} onSelect={() => doExport('png')}>
          PNG image
        </DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={() => doExport('svg')}>
          SVG vector
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
