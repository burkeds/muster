import { useState } from 'react';
import type { NodeMetadata } from '@/lib/tiledTypes';
import { useServerInfo } from '@/hooks/useServerInfo';
import { formatsForFamily, makeDownloadUrl } from '@/lib/tiledDownload';
import { useOptionalTiledClient } from '@/config/useTiledClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';

export interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segments: string[];
  metadata?: NodeMetadata | { attributes?: { structure_family?: string } };
}

/**
 * Pick the initial download format for a family. Containers (and any family
 * that advertises it) default to `application/json` because container/full does
 * not reliably serialize to HDF5 for real metadata.
 */
function initialFormat(formats: string[], family: string): string {
  if (family === 'container' && formats.includes('application/json')) {
    return 'application/json';
  }
  return formats[0] ?? 'application/json';
}

function familyOf(metadata: DownloadDialogProps['metadata']): string {
  // Support both bare NodeMetadata and thin stubs used by BrowsePage.
  const attrs =
    metadata && 'attributes' in metadata
      ? metadata.attributes
      : (metadata as { attributes?: { structure_family?: string } } | undefined)?.attributes;
  return attrs?.structure_family ?? 'array';
}

async function detailFromError(err: unknown): Promise<string> {
  // Avoid hard dependency on axios types — inspect duck-typed response shape.
  const ax = err as {
    response?: { status?: number; data?: unknown };
    message?: string;
  };
  if (ax?.response) {
    let detail = `Download failed (${ax.response.status ?? 'network'})`;
    const data = ax.response.data;
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      try {
        const body = JSON.parse(await data.text()) as { detail?: string };
        if (body?.detail) detail = String(body.detail);
      } catch {
        /* keep generic */
      }
    } else if (data && typeof data === 'object' && 'detail' in data) {
      detail = String((data as { detail?: string }).detail);
    }
    return detail;
  }
  if (err instanceof Error) return err.message;
  return 'Download failed';
}

/** Build a per-family download link using server-advertised formats. */
export function DownloadDialog({ open, onOpenChange, segments, metadata }: DownloadDialogProps) {
  const client = useOptionalTiledClient();
  const server = useServerInfo();
  const family = familyOf(metadata);
  const formats = formatsForFamily(server.data ?? undefined, family);
  const [format, setFormat] = useState<string>(() => initialFormat(formats, family));
  const [slice, setSlice] = useState('');
  const [filename, setFilename] = useState('');
  const [error, setError] = useState<string | null>(null);

  const extra: Record<string, string> = {};
  if (slice.trim()) extra.slice = slice.trim();
  if (filename.trim()) extra.filename = filename.trim();

  // Base is '' (not client.getBaseUrl()): the axios instance returned by
  // getAxiosClient() already has baseURL set to the (possibly proxied) base,
  // so embedding it again here would double it up for proxied/relative bases.
  const desc = client
    ? makeDownloadUrl('', family, segments, format, extra)
    : { url: '', filename: 'download' };

  const download = () => {
    if (!client) return;
    setError(null);
    void client
      .getAxiosClient()
      .get(desc.url, {
        responseType: 'blob',
        headers: { Accept: format },
      })
      .then((r: { data: Blob }) => {
        const blob = r.data;
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = desc.filename;
        a.click();
        URL.revokeObjectURL(href);
      })
      .catch(async (err: unknown) => {
        setError(await detailFromError(err));
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download {family}</DialogTitle>
          <DialogDescription>Convert this node to a format and download it.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="text-xs text-muted-foreground">Format</label>
          <Select
            value={format}
            onValueChange={(v) => {
              setFormat(v);
              setError(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a format" />
            </SelectTrigger>
            <SelectContent>
              {formats.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="text-xs text-muted-foreground">Slice (numpy-style, optional)</label>
          <Input
            placeholder="e.g. 0:10, 0:10"
            value={slice}
            onChange={(e) => setSlice(e.target.value)}
          />
          <label className="text-xs text-muted-foreground">Filename (optional)</label>
          <Input
            placeholder="download"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
          {family === 'container' ? (
            <p className="text-xs text-muted-foreground">
              Note: container export to HDF5 only works when the tree&apos;s metadata fits HDF5; JSON is
              the broadly-supported option.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={download}>
            <Download />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
