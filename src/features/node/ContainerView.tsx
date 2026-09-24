import { useNavigate } from 'react-router-dom';
import type { NodeResponse } from '@tiled/client-core';
import { NodeGrid } from '@/components/common/NodeGrid';
import { Pagination } from '@/components/common/Pagination';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePersistedBoolean } from '@/hooks/usePersistedBoolean';
import { useContainerListing } from './useContainerListing';

const PAGE_LIMIT = 60;

export interface ContainerViewProps {
  segments: string[];
  metadata: NodeResponse;
}

/** List the children of a container node (reuses the browse grid). */
export function ContainerView({ segments, metadata }: ContainerViewProps) {
  const navigate = useNavigate();
  const [hideEmpty, setHideEmpty] = usePersistedBoolean('muster:hide-empty', false);

  const { resources, total, hiddenCount, offset, setOffset, query } = useContainerListing({
    segments,
    hideEmpty,
  });

  // Fall back to the container's advertised child count before the listing loads.
  const listedCount =
    (metadata.data?.attributes?.structure as { count?: number } | undefined)?.count ?? 0;

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
            hiddenCount > 0
              ? `Container · ${total} children · ${hiddenCount} empty hidden`
              : `Container · ${total || listedCount} children`
          }
        />
      </div>
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
