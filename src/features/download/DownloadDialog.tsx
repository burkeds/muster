import { useState } from 'react';
import type { NodeResponse } from '@tiled/client-core';
import { useServerInfo } from '@/hooks/useServerInfo';
import { formatsForFamily } from '@tiled/client-core';
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
  metadata?: NodeResponse;
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

/** Build a per-family download link using server-advertised formats. */
export function DownloadDialog({ open, onOpenChange, segments, metadata }: DownloadDialogProps) {
  const client = useOptionalTiledClient();
  const server = useServerInfo();
  const family = metadata?.data?.attributes?.structure_family ?? 'array';
  const formats = formatsForFamily(server.data, family);
  const [format, setFormat] = useState<string>(() => initialFormat(formats, family));
  const [slice, setSlice] = useState('');
  const [filename, setFilename] = useState('');
  const [error, setError] = useState<string | null>(null);

  const extra: Record<string, string> = {};
  if (slice.trim()) extra.slice = slice.trim();
  if (filename.trim()) extra.filename = filename.trim();

  const desc = client
    ? client.downloadUrl(family, segments, format, extra)
    : { url: '', filename: 'download' };

  const download = () => {
    if (!client) return;
    setError(null);
    fetch(desc.url, {
      headers: {
        Accept: format,
        ...client.authHeaders(),
      },
    })
      .then(async (r) => {
        if (!r.ok) {
          let detail = `Download failed (${r.status})`;
          try {
            const body = (await r.json()) as { detail?: string };
            if (body?.detail) detail = String(body.detail);
          } catch {
            /* keep generic message */
          }
          throw new Error(detail);
        }
        return r.blob();
      })
      .then((blob) => {
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = desc.filename;
        a.click();
        URL.revokeObjectURL(href);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
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
              Note: container export to HDF5 only works when the tree's metadata fits HDF5; JSON is
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
