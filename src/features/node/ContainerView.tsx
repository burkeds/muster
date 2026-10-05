import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TiledSearchFilters } from '@blueskyproject/tiled';
import type { NodeMetadata } from '@/lib/tiledTypes';
import { NodeGrid } from '@/components/common/NodeGrid';
import { Pagination } from '@/components/common/Pagination';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePersistedBoolean } from '@/hooks/usePersistedBoolean';
import { ContainerFilter } from '@/features/search/ContainerFilter';
import { appContainerMetadataKeys } from '@/features/search/metadataKeys';
import { useContainerListing } from './useContainerListing';

const PAGE_LIMIT = 60;

export interface ContainerViewProps {
  segments: string[];
  metadata: NodeMetadata;
}

/** List the children of a container node (reuses the browse grid). */
export function ContainerView({ segments, metadata }: ContainerViewProps) {
  const navigate = useNavigate();
  const [hideEmpty, setHideEmpty] = usePersistedBoolean('muster:hide-empty', false);
  const [filter, setFilter] = useState<TiledSearchFilters | undefined>(undefined);

  const { resources, total, hiddenCount, offset, setOffset, query } = useContainerListing({
    segments,
    hideEmpty,
    filter,
  });

  // Fall back to the container's advertised child count before the listing loads.
  const listedCount =
    (metadata.attributes?.structure as { count?: number } | undefined)?.count ?? 0;
  const metadataKeys = appContainerMetadataKeys(resources);

  const handleSelect = (name: string, r: (typeof resources)[number]) => {
    const family = r.attributes?.structure_family;
    const parent = segments.join('/');
    const childPath = parent ? `${parent}/${name}` : name;
    navigate(family === 'container' ? `/browse/${childPath}` : `/node/${childPath}`);
  };

  const isContainer = (r: (typeof resources)[number]) =>
    (r.attributes?.structure_family ?? '') === 'container';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground">
          <Checkbox checked={hideEmpty} onCheckedChange={(v) => setHideEmpty(v === true)} />
          Hide empty containers
        </Label>
        <StatusLine
          className="text-xs text-muted-foreground"
          text={
            filter && Object.keys(filter).length > 0
              ? `Container · ${total} filtered result(s)${
                  hiddenCount > 0 ? ` · ${hiddenCount} empty hidden` : ''
                }`
              : hiddenCount > 0
              ? `Container · ${total} children · ${hiddenCount} empty hidden`
              : `Container · ${total || listedCount} children`
          }
        />
      </div>

      <ContainerFilter
        filter={filter}
        onApply={(f) => setFilter(f)}
        onClear={() => setFilter(undefined)}
        metadataKeys={metadataKeys}
      />

      {query.isError ? (
        <StateMessage kind="error" title="Failed to load contents" />
      ) : query.isLoading ? (
        <StateMessage kind="loading" title="Loading contents…" />
      ) : (
        <NodeGrid
          resources={resources}
          onSelect={handleSelect}
          isLink={isContainer}
          empty={
            hideEmpty && hiddenCount > 0 ? (
              <StateMessage
                kind="empty"
                title="No non-empty containers"
                description="Every container here is empty. Uncheck 'Hide empty containers' to see them."
              />
            ) : (
              <StateMessage kind="empty" title="No contents." />
            )
          }
        />
      )}
      {total > 0 ? (
        <Pagination offset={offset} limit={PAGE_LIMIT} total={total} onOffsetChange={setOffset} />
      ) : null}
    </div>
  );
}
