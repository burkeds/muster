import type { ReactNode } from 'react';
import type { ListingItem } from '@/lib/tiledTypes';
import { NodeCard } from './NodeCard';

export interface NodeGridProps {
  /** Resource list keyed by child name. */
  resources: Record<string, ListingItem> | ListingItem[];
  nameOf?: (resource: ListingItem) => string;
  onSelect: (name: string, resource: ListingItem) => void;
  isLink?: (resource: ListingItem) => boolean;
  footer?: (resource: ListingItem) => ReactNode;
  empty?: ReactNode;
}

/** Default child name: the node's own key (id), per Tiled search results. */
export function defaultNameOf(r: ListingItem): string {
  return r.id ?? (r.attributes?.ancestors ?? []).at(-1) ?? '';
}

/** Responsive grid of node cards for a container listing. */
export function NodeGrid({ resources, nameOf, onSelect, isLink, footer, empty }: NodeGridProps) {
  const resolveName = nameOf ?? defaultNameOf;
  const entries = Array.isArray(resources)
    ? resources.map((r) => ({ name: resolveName(r), r }))
    : Object.entries(resources).map(([name, r]) => ({ name, r }));

  if (entries.length === 0) {
    return <>{empty ?? <p className="text-sm text-muted-foreground">No contents.</p>}</>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entries.map(({ name, r }) => (
        <NodeCard
          key={name}
          name={name}
          resource={r}
          isLink={isLink?.(r)}
          onClick={() => onSelect(name, r)}
          footer={footer?.(r)}
        />
      ))}
    </div>
  );
}
