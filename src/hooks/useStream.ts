import { useEffect, useRef, useState } from 'react';
import type { EnvelopeFormat, StreamEnvelope, StreamStatus } from '@tiled/client-core';
import { useOptionalTiledClient } from '@/config/useTiledClient';

export interface UseStreamParams {
  segments: string[];
  envelopeFormat?: EnvelopeFormat;
  /** Replay from a starting sequence number. */
  start?: number;
  enabled?: boolean;
}

export interface UseStreamResult {
  status: StreamStatus;
  schema: unknown;
  envelopes: StreamEnvelope[];
  error: string | null;
  closeCode: number | null;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Connect to GET /stream/single/{segments} via WebSocket and collect live
 * envelopes. Handles reconnect on demand. API key auth is passed via ?api_key=.
 */
export function useStream(params: UseStreamParams): UseStreamResult {
  const client = useOptionalTiledClient();
  const { segments, envelopeFormat = 'json', start, enabled = true } = params;
  const [status, setStatus] = useState<StreamStatus>('closed');
  const [schema, setSchema] = useState<unknown>(null);
  const [envelopes, setEnvelopes] = useState<StreamEnvelope[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [closeCode, setCloseCode] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => setTick((t) => t + 1);
  const disconnect = () => wsRef.current?.close();

  useEffect(() => {
    if (!enabled || !segments.length || !client) return;
    const ws = new WebSocket(client.streamUrl(segments, { envelopeFormat, start }));
    wsRef.current = ws;
    setStatus('connecting');
    setError(null);
    setEnvelopes([]);
    setSchema(null);

    ws.onopen = () => setStatus('open');
    ws.onerror = () => {
      setStatus('error');
      setError('WebSocket error');
    };
    ws.onclose = (ev) => {
      setStatus('closed');
      setCloseCode(ev.code);
    };
    ws.onmessage = (ev) => {
      let data: StreamEnvelope & { type: string; schema?: unknown };
      try {
        data = JSON.parse(ev.data as string);
      } catch {
        return;
      }
      if (data.type === 'schema') {
        setSchema(data.schema ?? null);
        return;
      }
      setEnvelopes((prev) => [...prev, data]);
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [enabled, client, segments, envelopeFormat, start, tick]);

  return { status, schema, envelopes, error, closeCode, connect, disconnect };
}
