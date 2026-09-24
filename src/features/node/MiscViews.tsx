import type { NodeResponse, SparseStructure, RaggedStructure, AwkwardStructure } from '@tiled/client-core';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { JsonViewer } from '@/components/common/JsonViewer';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useOptionalTiledClient } from '@/config/useTiledClient';

/** Render a bytes node: expose the underlying asset download. */
export function BytesView({ segments, metadata }: { segments: string[]; metadata: NodeResponse }) {
  const client = useOptionalTiledClient();
  const assets = metadata.data?.attributes?.data_sources?.[0]?.assets;
  const asset = assets?.[0];
  const url = client ? client.assetBytes(segments, { id: asset?.id }) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <StatusLine text="Bytes asset" />
      {url && client ? (
        <a
          href={url}
          download
          className="inline-flex"
          onClick={(e) => {
            e.preventDefault();
            // Keep auth header via a manual blob fetch.
            fetch(url, {
              headers: {
                ...client.authHeaders(),
                Accept: 'application/octet-stream',
              },
            })
              .then((r) => r.blob())
              .then((blob) => {
                const href = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = href;
                a.download = asset?.parameter ?? 'download.bin';
                a.click();
                URL.revokeObjectURL(href);
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
  metadata: NodeResponse;
}

/** Read-only view for sparse arrays. */
export function SparseView({ metadata }: StructureViewProps) {
  const s = metadata.data?.attributes?.structure as SparseStructure | undefined;
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
  const s = metadata.data?.attributes?.structure as AwkwardStructure | undefined;
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
  const s = metadata.data?.attributes?.structure as RaggedStructure | undefined;
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
