import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNodeMetadata } from '@/hooks/useNodeMetadata';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { ArrayView } from '@/features/array/ArrayVisualizations';
import { TableView } from '@/features/table/TableView';
import { ContainerView } from './ContainerView';
import { BytesView, SparseView, AwkwardView, RaggedView } from './MiscViews';
import { H5ViewLauncher } from '@/features/h5/H5ViewLauncher';
import { useH5ExploreState } from '@/features/h5/useH5ExploreState';
import { useServerInfo } from '@/hooks/useServerInfo';
import { DownloadDialog } from '@/features/download/DownloadDialog';
import { MetadataPanel } from '@/features/metadata/MetadataPanel';
import { StreamView } from '@/features/stream/StreamView';

const STREAMABLE_FAMILIES = ['array', 'table', 'ragged', 'container'];

/** Detail page for a single node, dispatched by structure family with tabs. */
export function NodeDetailPage() {
  const params = useParams();
  const segments = (params['*'] ?? '').split('/').filter(Boolean);
  const navigate = useNavigate();
  const [downloadOpen, setDownloadOpen] = useState(false);

  const query = useNodeMetadata({
    segments,
    fields: ['structure_family', 'structure', 'specs', 'metadata', 'data_sources'],
    includeDataSources: true,
  });

  const server = useServerInfo();
  const { available, compatible } = useH5ExploreState({
    segments,
    metadata: query.data,
    containerFormats: server.data?.formats?.container,
  });

  if (segments.length === 0) {
    navigate('/browse', { replace: true });
    return null;
  }

  const metadata = query.data;
  const family = metadata?.data?.attributes?.structure_family;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Breadcrumbs segments={segments} currentIsLeaf />
          <StatusLine className="mt-1" text={`Node · ${family ?? '?'}`} />
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Back
        </Button>
      </div>

      {query.isError ? (
        <StateMessage kind="error" title="Failed to load node" description={String(query.error)} />
      ) : query.isLoading ? (
        <StateMessage kind="loading" title="Loading node…" />
      ) : !metadata ? (
        <StateMessage kind="empty" title="No data" />
      ) : (
        <Tabs defaultValue="view">
          <TabsList>
            <TabsTrigger value="view">View</TabsTrigger>
            <TabsTrigger value="download">Download</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            {family && STREAMABLE_FAMILIES.includes(family) ? (
              <TabsTrigger value="live">Live</TabsTrigger>
            ) : null}
          </TabsList>
          <TabsContent value="view">
            {renderView(family, segments, metadata, available, compatible)}
          </TabsContent>
          <TabsContent value="download">
            <Button variant="outline" onClick={() => setDownloadOpen(true)}>
              Download this node
            </Button>
          </TabsContent>
          <TabsContent value="metadata">
            <MetadataPanel data={metadata} />
          </TabsContent>
          {family && STREAMABLE_FAMILIES.includes(family) ? (
            <TabsContent value="live">
              <StreamView segments={segments} />
            </TabsContent>
          ) : null}
        </Tabs>
      )}

      <DownloadDialog
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        segments={segments}
        metadata={metadata}
      />
    </div>
  );
}

function renderView(
  family: string | undefined,
  segments: string[],
  metadata: NonNullable<ReturnType<typeof useNodeMetadata>['data']>,
  available: boolean,
  compatible: boolean,
) {
  switch (family) {
    case 'array':
      return <ArrayView segments={segments} metadata={metadata} />;
    case 'table':
      return <TableView segments={segments} metadata={metadata} />;
    case 'container':
      // Containers offering the HDF5 format get a "View with H5Web" button; it
      // is greyed out when the subtree is not explorable.
      return (
        <H5ViewLauncher
          segments={segments}
          available={available}
          compatible={compatible}
        >
          <ContainerView segments={segments} metadata={metadata} />
        </H5ViewLauncher>
      );
    case 'bytes':
      return <BytesView segments={segments} metadata={metadata} />;
    case 'sparse':
      return <SparseView metadata={metadata} />;
    case 'awkward':
      return <AwkwardView metadata={metadata} />;
    case 'ragged':
      return <RaggedView metadata={metadata} />;
    default:
      return <StateMessage kind="empty" title="Unsupported structure family" />;
  }
}
