import type { NodeMetadata } from '@/lib/tiledTypes';
import { JsonViewer } from '@/components/common/JsonViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function structureSummary(attrs: NodeMetadata['attributes'] | undefined) {
  if (!attrs) return [] as Array<[string, string]>;
  const family = attrs.structure_family;
  const s = attrs.structure as
    | {
        shape?: number[];
        chunks?: number[][];
        columns?: string[];
        npartitions?: number;
        count?: number;
        length?: number;
      }
    | undefined;
  const rows: Array<[string, string]> = [];
  if (family) rows.push(['Structure family', family]);
  if (s?.shape) rows.push(['Shape', `[${s.shape.join(', ')}]`]);
  if (s?.chunks) rows.push(['Chunks', `${s.chunks.length} axis`]);
  if (s?.columns) rows.push(['Columns', s.columns.join(', ')]);
  if (s?.npartitions !== undefined) rows.push(['Partitions', String(s.npartitions)]);
  if (s?.count !== undefined) rows.push(['Count', String(s.count)]);
  if (s?.length !== undefined) rows.push(['Length', String(s.length)]);
  const specs = attrs.specs;
  if (specs?.length)
    rows.push(['Specs', specs.map((x) => (typeof x === 'string' ? x : x.name)).join(', ')]);
  return rows;
}

/** Metadata + structure summary for a node. */
export function MetadataPanel({ data }: { data: NodeMetadata }) {
  const attrs = data.attributes;
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Structure</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {structureSummary(attrs).map(([k, v]) => (
            <div key={k} className="flex gap-2 text-sm">
              <span className="w-36 shrink-0 text-muted-foreground">{k}</span>
              <span className="break-all font-mono text-xs">{v}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <JsonViewer value={attrs?.metadata ?? {}} />
        </CardContent>
      </Card>
    </div>
  );
}
