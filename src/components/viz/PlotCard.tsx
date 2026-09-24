import { type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusLine } from '@/components/common/StatusLine';
import { PlotExportMenu } from './PlotExportMenu';

export interface PlotCardProps {
  /** Title line shown above the plot. */
  title: string;
  /** Viz/format label, e.g. "Line", "Heatmap". */
  label?: string;
  /** The plotly graph div used for export. */
  gd: HTMLDivElement | null;
  filename: string;
  children: ReactNode;
}

/** Framed plot with a header line and an Export (PNG/SVG) control. */
export function PlotCard({ title, label, gd, filename, children }: PlotCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <StatusLine
            className="min-w-0 flex-1 truncate"
            text={label ? `${title} · ${label}` : title}
          />
          <PlotExportMenu gd={gd} filename={filename} />
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
