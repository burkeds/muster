import type { ReactNode } from 'react';
import { Folders, Table2, Braces, Grid3x3, Rows3, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Resource, NodeAttributes, StructureFamily } from '@tiled/client-core';

const FAMILY_META: Record<StructureFamily, { label: string; icon: ReactNode }> = {
  container: { label: 'Container', icon: <Folders /> },
  array: { label: 'Array', icon: <Grid3x3 /> },
  table: { label: 'Table', icon: <Table2 /> },
  sparse: { label: 'Sparse', icon: <Braces /> },
  awkward: { label: 'Awkward', icon: <Braces /> },
  ragged: { label: 'Ragged', icon: <Rows3 /> },
  bytes: { label: 'Bytes', icon: <Box /> },
};

export function familyBadge(family?: StructureFamily, containerCount?: number): ReactNode {
  if (!family) return null;
  const meta = FAMILY_META[family];
  const count =
    family === 'container'
      ? containerCount !== undefined
        ? containerCount
        : undefined
      : undefined;
  return (
    <Badge variant="secondary" className="gap-1">
      {meta.icon}
      {meta.label}
      {count !== undefined ? ` · ${count}` : ''}
    </Badge>
  );
}

export interface NodeCardProps {
  resource: Resource<NodeAttributes>;
  name: string;
  onClick?: () => void;
  isLink?: boolean;
  footer?: ReactNode;
}

/** A clickable card representing one node in a listing. */
export function NodeCard({ resource, name, onClick, isLink, footer }: NodeCardProps) {
  const family = resource.attributes?.structure_family;
  const containerCount =
    family === 'container'
      ? (resource.attributes?.structure as { count?: number } | undefined)?.count
      : undefined;
  const metadata = resource.attributes?.metadata;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        isLink && 'ring-1 ring-ring/40',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {metadata ? safeString(metadata) : '—'}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          {familyBadge(family, containerCount)}
          {footer}
        </div>
      </CardContent>
    </Card>
  );
}

/** Best-effort single line summary of a metadata object. */
function safeString(metadata: Record<string, unknown>): string {
  const keys = Object.keys(metadata);
  if (keys.length === 0) return '';
  const first = metadata[keys[0]];
  if (first === undefined || first === null) return String(keys[0]);
  if (typeof first === 'object') return keys[0];
  return `${keys[0]}: ${String(first)}`;
}
