import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchOptions } from '@tiled/client-core';

const FAMILY_OPTIONS = ['array', 'awkward', 'bytes', 'container', 'ragged', 'sparse', 'table'];

export interface ContainerFilterProps {
  /** The currently applied filter (owned by the parent/listing). */
  filter: SearchOptions['filter'] | undefined;
  onApply: (filter: SearchOptions['filter']) => void;
  onClear: () => void;
}

function countFilter(f?: SearchOptions['filter']): number {
  if (!f) return 0;
  return Object.values(f).reduce((n, conds) => n + (conds?.length ?? 0), 0);
}

/**
 * Collapsible search/filter form for the current container's children.
 *
 * Tiled search is scoped to a container: the form builds a `filter` object and
 * the parent listing re-runs `/search/{segments}?filter[...]`, returning a
 * filtered container (only matching children).
 */
export function ContainerFilter({ filter, onApply, onClear }: ContainerFilterProps) {
  const [open, setOpen] = useState(false);
  const [fulltext, setFulltext] = useState('');
  const [eqKey, setEqKey] = useState('');
  const [eqValue, setEqValue] = useState('');
  const [cmpKey, setCmpKey] = useState('');
  const [cmpOp, setCmpOp] = useState('gt');
  const [cmpValue, setCmpValue] = useState('');
  const [family, setFamily] = useState<string>('any');

  const activeCount = countFilter(filter);

  const buildFilters = (): SearchOptions['filter'] => {
    const f: NonNullable<SearchOptions['filter']> = {};
    if (fulltext.trim()) f.fulltext = [['text', fulltext.trim()]];
    if (eqKey.trim() && eqValue !== '')
      f.eq = [
        ['key', eqKey.trim()],
        ['value', JSON.stringify(eqValue)],
      ];
    if (cmpKey.trim() && cmpValue !== '')
      f.comparison = [
        ['key', cmpKey.trim()],
        ['operator', cmpOp],
        ['value', JSON.stringify(cmpValue)],
      ];
    if (family !== 'any') f.structure_family = [['value', family]];
    return f;
  };

  const handleSearch = () => {
    onApply(buildFilters());
    setOpen(false);
  };

  const handleClear = () => {
    setFulltext('');
    setEqKey('');
    setEqValue('');
    setCmpKey('');
    setCmpOp('gt');
    setCmpValue('');
    setFamily('any');
    onClear();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant={activeCount > 0 ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <Search className="h-4 w-4" />
          {activeCount > 0 ? 'Filtering this container' : 'Search this container'}
          {activeCount > 0 ? (
            <Badge variant="secondary" className="px-1.5 py-0 text-xs">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
        {activeCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filter this container&rsquo;s children
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Fulltext</label>
              <Input
                placeholder="search text"
                className="w-48"
                value={fulltext}
                onChange={(e) => setFulltext(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Metadata key equal</label>
              <Input
                placeholder="key"
                className="w-32"
                value={eqKey}
                onChange={(e) => setEqKey(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Value</label>
              <Input
                placeholder="value"
                className="w-32"
                value={eqValue}
                onChange={(e) => setEqValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Compare key</label>
              <Input
                placeholder="key"
                className="w-32"
                value={cmpKey}
                onChange={(e) => setCmpKey(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Op</label>
              <Select value={cmpOp} onValueChange={setCmpOp}>
                <SelectTrigger className="w-24" aria-label="Comparison operator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['gt', 'lt', 'ge', 'le'].map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Value</label>
              <Input
                placeholder="value"
                className="w-24"
                value={cmpValue}
                onChange={(e) => setCmpValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Family</label>
              <Select value={family} onValueChange={setFamily}>
                <SelectTrigger className="w-32" aria-label="Structure family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {FAMILY_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {activeCount > 0 ? (
            <div className="text-xs text-muted-foreground">
              Showing {activeCount} active filter(s). Edit and press Search to re-apply.
            </div>
          ) : null}
          <div className={cn('flex items-center gap-2')}>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
