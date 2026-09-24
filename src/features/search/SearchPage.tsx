import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNodeSearch } from '@/hooks/useNodeSearch';
import { NodeGrid } from '@/components/common/NodeGrid';
import { Pagination } from '@/components/common/Pagination';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { SearchOptions, Resource, NodeAttributes } from '@tiled/client-core';

const PAGE_LIMIT = 60;

const FAMILY_OPTIONS = ['array', 'awkward', 'bytes', 'container', 'ragged', 'sparse', 'table'];

export function SearchPage() {
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [fulltext, setFulltext] = useState('');
  const [eqKey, setEqKey] = useState('');
  const [eqValue, setEqValue] = useState('');
  const [cmpKey, setCmpKey] = useState('');
  const [cmpOp, setCmpOp] = useState('gt');
  const [cmpValue, setCmpValue] = useState('');
  const [family, setFamily] = useState<string>('any');
  const [applied, setApplied] = useState<SearchOptions['filter']>(undefined);
  const [hasApplied, setHasApplied] = useState(false);

  const buildFilters = (): SearchOptions['filter'] => {
    const filter: NonNullable<SearchOptions['filter']> = {};
    if (fulltext.trim()) filter.fulltext = [['text', fulltext.trim()]];
    if (eqKey.trim() && eqValue !== '')
      filter.eq = [
        ['key', eqKey.trim()],
        ['value', JSON.stringify(eqValue)],
      ];
    if (cmpKey.trim() && cmpValue !== '')
      filter.comparison = [
        ['key', cmpKey.trim()],
        ['operator', cmpOp],
        ['value', JSON.stringify(cmpValue)],
      ];
    if (family !== 'any') filter.structure_family = [['value', family]];
    return filter;
  };

  const handleSearch = () => {
    setApplied(buildFilters());
    setHasApplied(true);
    setOffset(0);
  };

  // keepPreviousData-like paging by re-running search on offset change after first apply.
  const query = useNodeSearch({
    segments: [],
    pageOffset: offset,
    pageLimit: PAGE_LIMIT,
    fields: ['structure_family', 'structure', 'metadata'],
    filter: applied,
    enabled: hasApplied,
  });

  const total = query.data?.meta?.count ?? 0;
  const resources = query.data?.data ?? [];

  const handleSelect = (name: string, r: Resource<NodeAttributes>) => {
    navigate(r.attributes?.structure_family === 'container' ? `/browse/${name}` : `/node/${name}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <StatusLine
        text={hasApplied ? 'Search results' : 'Enter criteria below, then press Search.'}
      />
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-end gap-3">
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
              <SelectTrigger className="w-24">
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
              <SelectTrigger className="w-32">
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
          <Button onClick={handleSearch}>
            <Search />
            Search
          </Button>
        </div>
      </div>

      {!hasApplied ? null : query.isError ? (
        <StateMessage kind="error" title="Search failed" description={String(query.error)} />
      ) : query.isLoading ? (
        <StateMessage kind="loading" title="Searching…" />
      ) : (
        <NodeGrid
          resources={resources}
          onSelect={handleSelect}
          isLink={(r) => r.attributes?.structure_family === 'container'}
          empty={<StateMessage kind="empty" title="No results" />}
        />
      )}

      {total > 0 ? (
        <Pagination offset={offset} limit={PAGE_LIMIT} total={total} onOffsetChange={setOffset} />
      ) : null}
    </div>
  );
}
