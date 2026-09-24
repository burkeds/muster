import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

export interface TableRequest {
  partition: number;
  columns: string[];
}

export interface TableFormProps {
  npartitions: number;
  columns: string[];
  onSubmit: (request: TableRequest) => void;
}

/**
 * Inline prompt before table data is fetched. The user chooses which partition
 * (row block) and which columns to load; nothing is requested until Load. This
 * is the table-appropriate analog of array slicing.
 */
export function TableForm({ npartitions, columns, onSubmit }: TableFormProps) {
  const [partition, setPartition] = useState(0);
  const [selected, setSelected] = useState<string[]>(columns);

  const allColumns = selected.length === columns.length && columns.length > 0;
  const single = npartitions <= 1;

  const toggle = (col: string, checked: boolean) => {
    const next = checked ? [...selected, col] : selected.filter((c) => c !== col);
    setSelected(next.length ? next : []);
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <Label className="text-xs font-medium text-muted-foreground">
        Request a slice of the table (partition and columns)
      </Label>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">
            {single ? 'Partition (only 0)' : `Partition (0–${npartitions - 1})`}
          </Label>
          <Select
            value={String(partition)}
            onValueChange={(v) => setPartition(Number(v))}
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {Array.from({ length: npartitions }, (_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Columns</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {selected.length ? `${selected.length}/${columns.length} columns` : 'No columns'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Columns to fetch</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={allColumns}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => setSelected(columns)}
              >
                Select All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selected.length === 0}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => setSelected([])}
              >
                Select None
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <div className="max-h-72 overflow-auto">
                {columns.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c}
                    checked={selected.includes(c)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(checked) => toggle(c, !!checked)}
                  >
                    {c}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <p data-testid="table-request-description" className="text-xs text-muted-foreground">
        {selected.length}/{columns.length} columns ·{' '}
        {single ? 'single partition' : `partition ${partition}/${npartitions}`} · rows per partition
        not advertised
      </p>
      <div>
        {allColumns ? (
          <div
            role="alert"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600"
          >
            <span className="font-medium">Fetching all {columns.length} columns.</span> This is the
            largest possible request for a partition and may be slow if a partition holds many rows.
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={selected.length === 0}
          onClick={() => onSubmit({ partition, columns: selected })}
        >
          Load
        </Button>
      </div>
    </div>
  );
}
