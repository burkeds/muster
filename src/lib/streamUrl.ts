/**
 * WebSocket streaming URL builders for Tiled /stream/single.
 * Ported from tiled-client-core — the official SDK has no streaming support.
 */

export type EnvelopeFormat = 'json' | 'msgpack';

export interface StreamEnvelope {
  sequence: number;
  timestamp: string;
  type: string;
  mimetype?: string;
  shape?: number[];
  offset?: number[];
  patch?: Array<Record<string, number[]>>;
  payload?: unknown;
  uri?: string;
}

/** Status of a streaming websocket connection. */
export type StreamStatus = 'connecting' | 'open' | 'closed' | 'error';

/** Convert an http(s) base URL to a ws(s) stream URL. */
export function toWsUrl(url: string): string {
  return url.replace(/^http/, 'ws');
}

function absolutize(base: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(base)) return base;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  return `${origin}${base.startsWith('/') ? '' : '/'}${base}`;
}

export function streamUrl(
  base: string,
  segments: string[],
  opts: { envelopeFormat?: EnvelopeFormat; start?: number; apiKey?: string } = {},
): string {
  const resolved = absolutize(base.replace(/\/+$/, ''));
  const path = segments.map(encodeURIComponent).join('/');
  const url = new URL(`${toWsUrl(resolved)}/stream/single/${path}`);
  url.searchParams.set('envelope_format', opts.envelopeFormat ?? 'json');
  if (opts.start !== undefined) url.searchParams.set('start', String(opts.start));
  if (opts.apiKey) url.searchParams.set('api_key', opts.apiKey);
  return url.toString();
}
