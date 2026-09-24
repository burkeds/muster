import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Download, Info, RefreshCw } from 'lucide-react';
import type { Resource, NodeAttributes, NodeResponse } from '@tiled/client-core';

const PAGE_LIMIT = 60;

/** Metadata marker so the DownloadDialog treats the current node as a container. */
const CONTAINER_META = {
  data: { attributes: { structure_family: 'container' } },
} as unknown as NodeResponse;

/** Listing + navigation of container children (GET /search/{path}). */
export function BrowsePage() {
  const params = useParams();
  const segments = (params['*'] ?? '').split('/').filter(Boolean);
  const navigate = useNavigate();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [hideEmpty, setHideEmpty] = usePersistedBoolean('muster:hide-empty', false);
  const [showMetadata, setShowMetadata] = useState(false);

  const { resources, total, hiddenCount, offset, setOffset, query } = useContainerListing({
    segments,
    hideEmpty,
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

  const handleSelect = (name: string, resource: Resource<NodeAttributes>) => {
    const family = resource.attributes?.structure_family;
    const parent = segments.join('/');
    const childPath = parent ? `${parent}/${name}` : name;
    if (family === 'container') {
      navigate(`/browse/${childPath}`);
    } else {
      navigate(`/node/${childPath}`);
    }
  };

  const isContainer = (r: Resource<NodeAttributes>) =>
    (r.attributes?.structure_family ?? '') === 'container';

  const pathLabel = segments.length ? ` /${segments.join('/')}` : ' (root)';
  // Browsing a container path means the current node itself is a container.
  const canExportContainer = segments.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Breadcrumbs segments={segments} />
          <StatusLine
            className="mt-1"
            text={
              hiddenCount > 0
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
