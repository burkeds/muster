import type {
  AwkwardStructure,
  NodeMetadata,
  RaggedStructure,
  SparseStructure,
  TiledDataSource,
} from '@/lib/tiledTypes';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { JsonViewer } from '@/components/common/JsonViewer';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useOptionalTiledClient } from '@/config/useTiledClient';
import { assetBytesUrl } from '@/lib/tiledDownload';

/** Render a bytes node: expose the underlying asset download. */
export function BytesView({ segments, metadata }: { segments: string[]; metadata: NodeMetadata }) {
  const client = useOptionalTiledClient();
  const sources = metadata.attributes?.data_sources;
  const firstSource = Array.isArray(sources) ? (sources[0] as TiledDataSource | undefined) : undefined;
  const asset = firstSource?.assets?.[0];
  // href is the full, user-facing URL (for right-click/open-in-new-tab); the
  // fetch below uses a base-less path instead, since the axios instance from
  // getAxiosClient() already carries the (possibly proxied) base and would
  // otherwise have it applied twice.
  const href =
    client && asset?.id !== undefined
      ? assetBytesUrl(client.getBaseUrl(), segments, { id: asset.id })
      : undefined;
  const fetchUrl =
    client && asset?.id !== undefined ? assetBytesUrl('', segments, { id: asset.id }) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <StatusLine text="Bytes asset" />
      {href && fetchUrl && client ? (
        <a
          href={href}
          download
          className="inline-flex"
          onClick={(e) => {
            e.preventDefault();
            // Auth is carried by the axios instance interceptors.
            void client
              .getAxiosClient()
              .get(fetchUrl, {
                responseType: 'blob',
                headers: { Accept: 'application/octet-stream' },
              })
              .then((r: { data: Blob }) => {
                const blobHref = URL.createObjectURL(r.data);
                const a = document.createElement('a');
                a.href = blobHref;
                a.download = asset?.parameter ?? 'download.bin';
                a.click();
                URL.revokeObjectURL(blobHref);
              });
          }}
        >
          <Button variant="outline">
            <Download />
            Download asset{asset ? ` (${asset.size} bytes)` : ''}
          </Button>
        </a>
      ) : (
        <StateMessage kind="empty" title="No assets" />
      )}
    </div>
  );
}

export interface StructureViewProps {
  metadata: NodeMetadata;
}

/** Read-only view for sparse arrays. */
export function SparseView({ metadata }: StructureViewProps) {
  const s = metadata.attributes?.structure as SparseStructure | undefined;
  return (
    <div className="flex flex-col gap-3">
      <StatusLine text={`Sparse array · COO · shape ${s ? `[${s.shape.join(', ')}]` : ''}`} />
      <StateMessage
        kind="empty"
        title="Sparse viewer"
        description="Per-chunk sparse data rendering is not yet implemented."
      />
      <JsonViewer value={s ?? {}} />
    </div>
  );
}

/** Read-only view for awkward arrays. */
export function AwkwardView({ metadata }: StructureViewProps) {
  const s = metadata.attributes?.structure as AwkwardStructure | undefined;
  return (
    <div className="flex flex-col gap-3">
      <StatusLine text={`Awkward array · length ${s?.length ?? '?'}`} />
      <StateMessage
        kind="empty"
        title="Awkward viewer"
        description="Awkward buffers rendering is not yet implemented."
      />
      <JsonViewer value={s?.form ?? {}} />
    </div>
  );
}

/** Read-only view for ragged arrays. */
export function RaggedView({ metadata }: StructureViewProps) {
  const s = metadata.attributes?.structure as RaggedStructure | undefined;
  return (
    <div className="flex flex-col gap-3">
      <StatusLine text={`Ragged array · size ${s?.size ?? '?'}`} />
      <StateMessage
        kind="empty"
        title="Ragged viewer"
        description="Ragged block rendering is not yet implemented."
      />
      <JsonViewer value={s ?? {}} />
    </div>
  );
}
