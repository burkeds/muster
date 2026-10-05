import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { TiledSearchFilters } from '@blueskyproject/tiled';
import { useNodeMetadata } from '@/hooks/useNodeMetadata';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { NodeGrid } from '@/components/common/NodeGrid';
import { Pagination } from '@/components/common/Pagination';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { humanizeError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DownloadDialog } from '@/features/download/DownloadDialog';
import { H5ViewLauncher } from '@/features/h5/H5ViewLauncher';
import { useH5ExploreState } from '@/features/h5/useH5ExploreState';
import { useServerInfo } from '@/hooks/useServerInfo';
import { useContainerListing } from '@/features/node/useContainerListing';
import { usePersistedBoolean } from '@/hooks/usePersistedBoolean';
import { MetadataPanel } from '@/features/metadata/MetadataPanel';
import { ContainerFilter } from '@/features/search/ContainerFilter';
import { appContainerMetadataKeys } from '@/features/search/metadataKeys';
import { Download, Info, RefreshCw } from 'lucide-react';
import type { ListingItem } from '@/lib/tiledTypes';

const PAGE_LIMIT = 60;

/** Metadata marker so the DownloadDialog treats the current node as a container. */
const CONTAINER_META = {
  attributes: { structure_family: 'container' as const },
};

/** Listing + navigation of container children (GET /search/{path}). */
export function BrowsePage() {
  const params = useParams();
  const segments = (params['*'] ?? '').split('/').filter(Boolean);
  const navigate = useNavigate();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [hideEmpty, setHideEmpty] = usePersistedBoolean('muster:hide-empty', false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [filter, setFilter] = useState<TiledSearchFilters | undefined>(undefined);

  const { resources, total, hiddenCount, offset, setOffset, query } = useContainerListing({
    segments,
    hideEmpty,
    filter,
  });

  // The current container's own metadata determines whether it offers HDF5.
  const nodeMeta = useNodeMetadata({
    segments,
    fields: ['structure_family', 'structure', 'specs', 'metadata', 'data_sources'],
    includeDataSources: true,
  });
  const server = useServerInfo();
  const { available, compatible } = useH5ExploreState({
    segments,
    metadata: nodeMeta.data,
    containerFormats: server.data?.formats?.container,
    childrenFamilies: resources.map((r) => r.attributes?.structure_family),
  });

  const handleSelect = (name: string, resource: ListingItem) => {
    const family = resource.attributes?.structure_family;
    const parent = segments.join('/');
    const childPath = parent ? `${parent}/${name}` : name;
    if (family === 'container') {
      navigate(`/browse/${childPath}`);
    } else {
      navigate(`/node/${childPath}`);
    }
  };

  const isContainer = (r: ListingItem) =>
    (r.attributes?.structure_family ?? '') === 'container';

  const pathLabel = segments.length ? ` /${segments.join('/')}` : ' (root)';
  // Browsing a container path means the current node itself is a container.
  const canExportContainer = segments.length > 0;
  const metadataKeys = appContainerMetadataKeys(resources);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Breadcrumbs segments={segments} />
          <StatusLine
            className="mt-1"
            text={
              filter && Object.keys(filter).length > 0
                ? `Browse${pathLabel} · filtered · ${total} result(s)${
                    hiddenCount > 0 ? ` · ${hiddenCount} empty hidden` : ''
                  }`
                : hiddenCount > 0
                ? `Browse${pathLabel} · ${hiddenCount} empty hidden`
                : `Browse${pathLabel}`
            }
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground">
            <Checkbox checked={hideEmpty} onCheckedChange={(v) => setHideEmpty(v === true)} />
            Hide empty containers
          </Label>
          {canExportContainer ? (
            <Button variant="outline" size="sm" onClick={() => setShowMetadata((v) => !v)}>
              <Info />
              Metadata
            </Button>
          ) : null}
          {canExportContainer ? (
            <Button variant="outline" size="sm" onClick={() => setDownloadOpen(true)}>
              <Download />
              Export
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={query.isFetching ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      <ContainerFilter
        filter={filter}
        onApply={(f) => setFilter(f)}
        onClear={() => setFilter(undefined)}
        metadataKeys={metadataKeys}
      />

      {showMetadata ? (
        canExportContainer ? (
          nodeMeta.isLoading ? (
            <StateMessage kind="loading" title="Loading metadata…" />
          ) : nodeMeta.isError ? (
            <StateMessage
              kind="error"
              title="Failed to load metadata"
              description={String(nodeMeta.error)}
            />
          ) : nodeMeta.data ? (
            <MetadataPanel data={nodeMeta.data} />
          ) : (
            <StateMessage kind="empty" title="No metadata" />
          )
        ) : null
      ) : null}

      <H5ViewLauncher segments={segments} available={available} compatible={compatible}>
        {query.isError ? (
          <StateMessage
            kind="error"
            title={humanizeError(query.error).title}
            description={humanizeError(query.error).detail}
          />
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
                <StateMessage
                  kind="empty"
                  title="Empty container"
                  description="This container has no children."
                />
              )
            }
          />
        )}

        {total > 0 ? (
          <Pagination offset={offset} limit={PAGE_LIMIT} total={total} onOffsetChange={setOffset} />
        ) : null}
      </H5ViewLauncher>

      <DownloadDialog
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        segments={segments}
        metadata={CONTAINER_META}
      />
    </div>
  );
}
