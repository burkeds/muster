import type { PaginationLinks } from '@tiled/client-core';

/**
 * Extract a browse/search path from a segments array.
 * Returns ['a','b'] from ['a','b'].
 */
export function segmentsToPath(segments: string[]): string {
  return segments.filter(Boolean).join('/');
}

/** Resolve a relative link to a page offset if it encodes page[offset]. */
export function pageOffsetFromLink(
  links: PaginationLinks | undefined,
  which: 'next' | 'prev' | 'first' | 'last',
): number | undefined {
  const url = links?.[which];
  if (!url) return undefined;
  try {
    const parsed = new URL(url, 'http://localhost');
    const offset = parsed.searchParams.get('page[offset]');
    return offset === null ? undefined : Number(offset);
  } catch {
    return undefined;
  }
}

/** The last segment of a path (the node's own name). */
export function leafSegment(segments: string[]): string {
  return segments[segments.length - 1] ?? '';
}

/** Human-friendly byte/entry counts. */
export function formatCount(count: number | undefined, family?: string): string {
  if (count === undefined) return '';
  if (family === 'table') return `${count} partition${count === 1 ? '' : 's'}`;
  return `${count} item${count === 1 ? '' : 's'}`;
}
