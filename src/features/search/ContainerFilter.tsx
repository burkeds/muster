import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { SearchOptions } from '@tiled/client-core';

const FAMILY_OPTIONS = ['array', 'awkward', 'bytes', 'container', 'ragged', 'sparse', 'table'];
const COMPARISON_OPS = ['gt', 'lt', 'ge', 'le'];

/** id shared by the metadata-key datalist so all key inputs autocomplete. */
const KEYLIST_ID = 'muster-metadata-keys';

function countFilter(f?: SearchOptions['filter']): number {
  if (!f) return 0;
  let n = 0;
  for (const conds of Object.values(f)) n += conds?.length ?? 1;
  return n;
}

export interface ContainerFilterProps {
  /** The currently applied filter (owned by the parent/listing). */
  filter: SearchOptions['filter'] | undefined;
  onApply: (filter: SearchOptions['filter']) => void;
  onClear: () => void;
  /** Nested metadata keys discovered from the container's children (autocomplete). */
  metadataKeys?: string[];
}

function KeyDatalist({ keys }: { keys: string[] }) {
  return (
    <datalist id={KEYLIST_ID}>
      {keys.map((k) => (
        <option key={k} value={k} />
      ))}
    </datalist>
  );
}

/**
 * Collapsible search/filter form for the current container's children.
 *
 * Tiled search is scoped to a container and supports nested metadata keys via
 * dot-separated paths (e.g. `element.name`, `edges.K.energy_eV`). The form builds
 * a `filter` object and the parent listing re-runs `/search/{segments}?filter[...]`,
 * returning a filtered container (only matching children).
 */
export function ContainerFilter({
  filter,
  onApply,
  onClear,
  metadataKeys = [],
}: ContainerFilterProps) {
  const [open, setOpen] = useState(false);

  const [fulltext, setFulltext] = useState('');
  const [eqKey, setEqKey] = useState('');
  const [eqValue, setEqValue] = useState('');
  const [containsKey, setContainsKey] = useState('');
  const [containsValue, setContainsValue] = useState('');
  const [inKey, setInKey] = useState('');
  const [inValue, setInValue] = useState('');
  const [inMode, setInMode] = useState<'in' | 'notin'>('in');
  const [likeKey, setLikeKey] = useState('');
  const [likePattern, setLikePattern] = useState('');
  const [cmpKey, setCmpKey] = useState('');
  const [cmpOp, setCmpOp] = useState('gt');
  const [cmpValue, setCmpValue] = useState('');
  const [kpKey, setKpKey] = useState('');
  const [kpExists, setKpExists] = useState(true);
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
    if (containsKey.trim() && containsValue !== '')
      f.contains = [
        ['key', containsKey.trim()],
        ['value', JSON.stringify(containsValue)],
      ];
    if (inKey.trim()) {
      const list = inValue
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length) {
        f[inMode] = [
          ['key', inKey.trim()],
          ['value', JSON.stringify(list)],
        ];
      }
    }
    if (likeKey.trim() && likePattern.trim())
      f.like = [
        ['key', likeKey.trim()],
        ['pattern', likePattern.trim()],
      ];
    if (cmpKey.trim() && cmpValue !== '')
      f.comparison = [
        ['key', cmpKey.trim()],
        ['operator', cmpOp],
        ['value', JSON.stringify(cmpValue)],
      ];
    if (kpKey.trim())
      f.keypresent = [
        ['key', kpKey.trim()],
        ['exists', String(kpExists)],
      ];
    if (family !== 'any') f.structure_family = [['value', family]];
    return f;
  };

  const handleSearch = () => {
    onApply(buildFilters());
    setOpen(false);
  };

  const resetAll = () => {
    setFulltext('');
    setEqKey('');
    setEqValue('');
    setContainsKey('');
    setContainsValue('');
    setInKey('');
    setInValue('');
    setInMode('in');
    setLikeKey('');
    setLikePattern('');
    setCmpKey('');
    setCmpOp('gt');
    setCmpValue('');
    setKpKey('');
    setKpExists(true);
    setFamily('any');
  };

  const handleClear = () => {
    resetAll();
    onClear();
  };

  return (
    <div className="flex flex-col gap-2">
      {open ? <KeyDatalist keys={metadataKeys} /> : null}
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
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filter this container&rsquo;s children (criteria are AND-combined)
          </div>

          <Field label="Fulltext" hint="Searches all metadata values">
            <Input
              placeholder="search text"
              className="w-64"
              value={fulltext}
              onChange={(e) => setFulltext(e.target.value)}
            />
          </Field>

          <Field label="Metadata equal" hint="Key may be nested: element.name">
            <KeyInput
              list={KEYLIST_ID}
              placeholder="key"
              value={eqKey}
              onChange={setEqKey}
            />
            <Input
              placeholder="value"
              className="w-40"
              value={eqValue}
              onChange={(e) => setEqValue(e.target.value)}
            />
          </Field>

          <Field label="Contains" hint="Value is a substring / member of a list">
            <KeyInput
              list={KEYLIST_ID}
              placeholder="key"
              value={containsKey}
              onChange={setContainsKey}
            />
            <Input
              placeholder="value"
              className="w-40"
              value={containsValue}
              onChange={(e) => setContainsValue(e.target.value)}
            />
          </Field>

          <Field label={`${inMode === 'in' ? 'In' : 'Not in'}`} hint="Comma-separated values">
            <KeyInput
              list={KEYLIST_ID}
              placeholder="key"
              value={inKey}
              onChange={setInKey}
            />
            <Input
              placeholder="a, b, c"
              className="w-40"
              value={inValue}
              onChange={(e) => setInValue(e.target.value)}
            />
            <Select
              value={inMode}
              onValueChange={(v) => setInMode(v as 'in' | 'notin')}
            >
              <SelectTrigger className="w-24" aria-label="Membership operator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">in</SelectItem>
                <SelectItem value="notin">not in</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Like (SQL wildcard)" hint="Pattern e.g. Ni% or %image">
            <KeyInput
              list={KEYLIST_ID}
              placeholder="key"
              value={likeKey}
              onChange={setLikeKey}
            />
            <Input
              placeholder="pattern"
              className="w-40"
              value={likePattern}
              onChange={(e) => setLikePattern(e.target.value)}
            />
          </Field>

          <Field label="Compare (numeric)" hint="Key may be nested: element.atomic_number">
            <KeyInput
              list={KEYLIST_ID}
              placeholder="key"
              value={cmpKey}
              onChange={setCmpKey}
            />
            <Select value={cmpOp} onValueChange={setCmpOp}>
              <SelectTrigger className="w-24" aria-label="Comparison operator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPARISON_OPS.map((op) => (
                  <SelectItem key={op} value={op}>
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="value"
              className="w-24"
              value={cmpValue}
              onChange={(e) => setCmpValue(e.target.value)}
            />
          </Field>

          <Field label="Key exists" hint="Matches nodes that have this (nested) key">
            <KeyInput
              list={KEYLIST_ID}
              placeholder="key"
              value={kpKey}
              onChange={setKpKey}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={kpExists}
                onCheckedChange={(v) => setKpExists(v === true)}
              />
              exists
            </label>
          </Field>

          <Field label="Structure family">
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
          </Field>

          {metadataKeys.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Tip: the key fields autocomplete from metadata of the children already loaded.
            </p>
          ) : null}

          <div className="flex items-center gap-2">
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-baseline gap-2">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {hint ? <span className="text-[11px] text-muted-foreground/70">{hint}</span> : null}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function KeyInput({
  list,
  placeholder,
  value,
  onChange,
}: {
  list: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      list={list}
      placeholder={placeholder}
      className="w-48 font-mono text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
