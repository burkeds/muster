import { useState } from 'react';
import { useStream } from '@/hooks/useStream';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Square, RotateCcw } from 'lucide-react';

export interface StreamViewProps {
  segments: string[];
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  open: 'default',
  connecting: 'secondary',
  closed: 'secondary',
  error: 'destructive',
};

/** Live + replay viewer over the Tiled /stream/single WebSocket. */
export function StreamView({ segments }: StreamViewProps) {
  const [start, setStart] = useState<number | undefined>(undefined);
  const [startInput, setStartInput] = useState('');
  const { status, schema, envelopes, error, closeCode, connect, disconnect } = useStream({
    segments,
    start,
    enabled: segments.length > 0,
  });

  const statusText =
    status === 'open'
      ? `Streaming live (${envelopes.length} envelopes)`
      : status === 'connecting'
        ? 'Connecting…'
        : status === 'error'
          ? (error ?? 'Stream error')
          : closeCode !== null
            ? `Stream closed (${closeCode})`
            : 'Stream disconnected';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusLine text={statusText} live={status === 'open'} />
          <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Replay from seq"
            className="h-8 w-36"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const n = Number(startInput);
              setStart(Number.isNaN(n) ? undefined : n);
              connect();
            }}
          >
            <Play />
            Connect
          </Button>
          <Button size="sm" variant="outline" onClick={disconnect}>
            <Square />
            Stop
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setStart(undefined);
              setStartInput('');
              connect();
            }}
          >
            <RotateCcw />
            Reset
          </Button>
        </div>
      </div>

      {status === 'closed' && envelopes.length === 0 ? (
        <StateMessage
          kind="empty"
          title="Not connected"
          description="Connect to start streaming."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {schema !== null && schema !== undefined ? (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Schema</p>
              <pre className="max-h-40 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </div>
          ) : null}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Envelopes ({envelopes.length})
            </p>
            <div className="flex max-h-80 flex-col gap-1 overflow-auto rounded-lg border p-2">
              {envelopes.length === 0 ? (
                <p className="text-xs text-muted-foreground">Waiting for data…</p>
              ) : (
                envelopes.map((env, i) => (
                  <div
                    key={`${env.sequence}-${i}`}
                    className="flex items-center gap-2 rounded border px-2 py-1 text-xs"
                  >
                    <Badge variant="secondary">{env.type}</Badge>
                    <span className="text-muted-foreground">#{env.sequence}</span>
                    {env.mimetype ? <span className="font-mono">{env.mimetype}</span> : null}
                    {env.shape ? <span className="font-mono">[{env.shape.join(', ')}]</span> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
