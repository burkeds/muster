export type QueryParamValue = string | number | boolean | string[] | undefined;

/** Minimal server-info shape used for format discovery (SDK TiledInfoResponse). */
export interface ServerFormatsInfo {
  formats?: Record<string, string[] | undefined>;
}

/** Append encoded path segments under a Tiled base URL. */
export function joinTiledPath(base: string, ...parts: string[]): string {
  const baseClean = base.replace(/\/+$/, '');
  const path = parts
    .filter((p) => p !== '')
    .map((p) => p.split('/').filter(Boolean).map(encodeURIComponent).join('/'))
    .filter(Boolean)
    .join('/');
  return path ? `${baseClean}/${path}` : baseClean;
}

/** Build a query string from a params object (arrays become repeated keys). */
export function toQueryString(params: Record<string, QueryParamValue> = {}): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) qs.append(key, String(item));
    } else {
      qs.set(key, String(value));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

function resourceUrl(
  base: string,
  family: string,
  rest: string[],
  params: Record<string, QueryParamValue> = {},
): string {
  return `${joinTiledPath(base, family, ...rest)}${toQueryString(params)}`;
}

/** GET /array/full/{segments} */
export function arrayFullUrl(
  base: string,
  segments: string[],
  params: { slice?: string; format?: string; filename?: string } = {},
): string {
  return resourceUrl(base, 'array', ['full', ...segments], params);
}

/** GET /table/full/{segments} */
export function tableFullUrl(
  base: string,
  segments: string[],
  params: { format?: string; filename?: string; column?: string[] } = {},
): string {
  return resourceUrl(base, 'table', ['full', ...segments], params);
}

/** GET /table/partition/{segments} */
export function tablePartitionUrl(
  base: string,
  segments: string[],
  params: { partition?: number; column?: string[]; format?: string } = {},
): string {
  return resourceUrl(base, 'table', ['partition', ...segments], params);
}

/** GET /container/full/{segments} */
export function containerFullUrl(
  base: string,
  segments: string[],
  params: { format?: string; filename?: string } = {},
): string {
  return resourceUrl(base, 'container', ['full', ...segments], params);
}

/** GET /asset/bytes/{segments} */
export function assetBytesUrl(
  base: string,
  segments: string[],
  params: { id?: string | number; filename?: string } = {},
): string {
  return resourceUrl(base, 'asset', ['bytes', ...segments], params);
}

/** Human-readable format labels from the server info formats map. */
export function formatsForFamily(
  info: ServerFormatsInfo | null | undefined,
  family: string,
): string[] {
  if (!info?.formats) return [];
  return info.formats[family] ?? [];
}

export interface DownloadDescriptor {
  url: string;
  filename: string;
}

/** Build a download link for a structure family. */
export function makeDownloadUrl(
  base: string,
  family: string,
  segments: string[],
  format: string,
  extra: Record<string, string> = {},
): DownloadDescriptor {
  let url: string;
  switch (family) {
    case 'array':
    case 'sparse':
      url = arrayFullUrl(base, segments, { format, ...extra });
      break;
    case 'table':
      url = tableFullUrl(base, segments, { format, ...extra });
      break;
    case 'container':
      url = containerFullUrl(base, segments, { format, filename: extra.filename });
      break;
    default:
      url = resourceUrl(base, 'node', ['full', ...segments], { format });
  }
  const leaf = segments[segments.length - 1] ?? 'download';
  return { url, filename: `${leaf}.${formatLabel(format)}` };
}

export function formatLabel(format: string): string {
  const map: Record<string, string> = {
    'application/json': 'json',
    'application/json-seq': 'jsonl',
    'text/csv': 'csv',
    'image/png': 'png',
    'image/tiff': 'tiff',
    'application/x-parquet': 'parquet',
    'application/vnd.apache.arrow.file': 'arrow',
    'application/x-hdf5': 'h5',
    'application/octet-stream': 'bin',
    'application/zip': 'zip',
    'application/vnd.ms-excel': 'xls',
  };
  return map[format] ?? format.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
}
