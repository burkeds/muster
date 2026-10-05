import { useState, type ReactNode } from 'react';
import type { Data } from 'plotly.js';
import type { TableStructure, NodeMetadata } from '@/lib/tiledTypes';
import { useTableData } from '@/hooks/useTableData';
import { PlotlyPlot } from '@/lib/plot';
import { PlotCard } from '@/components/viz/PlotCard';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableForm, type TableRequest } from './TableForm';

export interface TableViewProps {
  segments: string[];
  metadata: NodeMetadata;
}

/**
 * Render a table node. Nothing is fetched on mount: the user first chooses a
 * partition and column subset (TableForm), then the data loads. After it loads
 * the user can switch between a tabular and a charted view of those columns and
 * page through partitions.
 */
export function TableView({ segments, metadata }: TableViewProps) {
  const structure = metadata.attributes?.structure as TableStructure | undefined;
  const columns = structure?.columns ?? [];
  const npartitions = structure?.npartitions ?? 1;
  const filename = metadata.id ?? 'table';

  const [request, setRequest] = useState<TableRequest | null>(null);
  const [mode, setMode] = useState<'table' | 'chart'>('table');
  const [xCol, setXCol] = useState<string | undefined>(request?.columns?.[0]);
  const [yCols, setYCols] = useState<string[]>(() => {
    const cols = request?.columns ?? [];
    if (cols.length > 1) return [cols[1]];
    return cols.length ? [cols[0]] : [];
  });

  const partition = request?.partition ?? 0;
  const fetchedColumns = request?.columns ?? [];
  const query = useTableData({
    segments,
    partition,
    columns: fetchedColumns,
    enabled: request !== null && fetchedColumns.length > 0,
  });

  const setPartition = (p: number) => {
    if (request) setRequest({ ...request, partition: p });
  };

  const headerLabel = columns.length ? `${columns.length} cols` : '?';
  const single = npartitions <= 1;
  const statusText = `Table · ${single ? 'single partition' : `partition ${partition}/${npartitions}`} · ${fetchedColumns.length}/${headerLabel}`;

  return (
    <div className="flex flex-col gap-3">
      {request === null ? (
        <>
          <StatusLine text={`Table · ${npartitions} partition(s) · ${columns.length} columns`} />
          <TableForm
            npartitions={npartitions}
            columns={columns}
            onSubmit={(r) => {
              setXCol(r.columns[0]);
              setYCols(r.columns.length > 1 ? [r.columns[1]] : r.columns.length ? [r.columns[0]] : []);
              setRequest(r);
            }}
          />
          <StateMessage
            kind="empty"
            title="Request a table view"
            description="Choose a partition and column subset above to load the data."
          />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <StatusLine text={statusText} />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={partition <= 0}
                  onClick={() => setPartition(Math.max(0, partition - 1))}
                >
                  Prev
                </Button>
                <span className="px-2 text-muted-foreground">
                  {partition + 1}/{npartitions}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={partition >= npartitions - 1}
                  onClick={() => setPartition(Math.min(npartitions - 1, partition + 1))}
                >
                  Next
                </Button>
              </div>
              <Tabs value={mode} onValueChange={(v) => setMode(v as 'table' | 'chart')}>
                <TabsList>
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="chart">Chart</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {query.isError ? (
            <StateMessage kind="error" title="Failed to load table" />
          ) : query.isLoading ? (
            <StateMessage kind="loading" title="Loading table…" />
          ) : !fetchedColumns.length ? (
            <StateMessage kind="empty" title="No columns" />
          ) : mode === 'chart' ? (
            <TableChart
              data={query.data ?? {}}
              columns={fetchedColumns}
              xCol={xCol}
              yCols={yCols}
              setXCol={setXCol}
              setYCols={setYCols}
              filename={filename}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {fetchedColumns.map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>{renderRows(query.data ?? {}, fetchedColumns)}</TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}

interface TableChartProps {
  data: Record<string, (number | string | boolean | null)[]>;
  columns: string[];
  xCol: string | undefined;
  yCols: string[];
  setXCol: (c: string) => void;
  setYCols: (cols: string[]) => void;
  filename: string;
}

function TableChart({ data, columns, xCol, yCols, setXCol, setYCols, filename }: TableChartProps) {
  const [gd, setGd] = useState<HTMLDivElement | null>(null);
  const traces: Data[] = yCols.map((col) => ({
    x: xCol ? toSeries(data[xCol]) : undefined,
    y: toSeries(data[col]),
    name: col,
    type: 'scatter',
    mode: 'lines+markers',
  }));

  const toggleY = (col: string, checked: boolean) => {
    const next = checked ? [...yCols, col] : yCols.filter((c) => c !== col);
    setYCols(next.length ? next : [yCols[0] ?? col]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">X column</Label>
          <Select value={xCol} onValueChange={(v) => setXCol(v)}>
            <SelectTrigger className="h-8 w-44">
              <SelectValue placeholder="Choose column" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Y columns</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {yCols.length ? yCols.join(', ') : 'Choose columns'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Series to plot</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={yCols.includes(c)}
                  onCheckedChange={(checked) => toggleY(c, !!checked)}
                >
                  {c}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {yCols.length ? (
        <PlotCard title={filename} label={`${xCol ?? 'index'} vs ${yCols.join(', ')}`} gd={gd} filename={filename}>
          <PlotlyPlot
            onInitialized={setGd}
            height={340}
            data={traces}
            layout={{ xaxis: { title: xCol }, yaxis: { title: '' } }}
          />
        </PlotCard>
      ) : (
        <StateMessage kind="empty" title="Select at least one Y column" />
      )}
    </div>
  );
}

/** Narrow table cell values to plotly-plotable numeric/string series. */
function toSeries(values: (number | string | boolean | null)[] | undefined): (number | string)[] {
  return (values ?? []).filter(
    (v): v is number | string => v !== null && typeof v !== 'boolean',
  );
}

/** Render a columnar JSON table as rows. */
function renderRows(data: Record<string, (number | string | boolean | null)[]>, columns: string[]) {
  const first = columns[0];
  const lengths = first ? (data[first]?.length ?? 0) : 0;
  const rows: ReactNode[] = [];
  for (let i = 0; i < lengths; i++) {
    rows.push(
      <TableRow key={i}>
        {columns.map((c) => (
          <TableCell key={c} className="font-mono text-xs">
            {String(data[c]?.[i] ?? '')}
          </TableCell>
        ))}
      </TableRow>,
    );
  }
  return rows.length ? rows : null;
}
