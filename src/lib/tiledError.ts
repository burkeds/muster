export type ErrorKind = 'http' | 'network' | 'cors';

/** Normalized error thrown by Tiled request helpers. */
export class TiledError extends Error {
  status?: number;
  detail: unknown;
  kind: ErrorKind;
  url?: string;
  constructor(
    message: string,
    opts: { status?: number; detail?: unknown; kind?: ErrorKind; url?: string } = {},
  ) {
    super(message);
    this.name = 'TiledError';
    this.status = opts.status;
    this.detail = opts.detail;
    this.kind = opts.kind ?? 'http';
    this.url = opts.url;
  }
}
