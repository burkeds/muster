/**
 * Derive candidate metadata keys (including nested, dot-separated paths) from a
 * set of child-node metadata objects. Used to autocomplete Tiled filter keys.
 */
export function collectMetadataKeys(
  metadatas: (Record<string, unknown> | undefined)[],
): string[] {
  const set = new Set<string>();
  for (const m of metadatas) {
    if (!m || typeof m !== 'object') continue;
    walk(m, set, '');
  }
  return [...set].sort();
}function walk(
  obj: Record<string, unknown>,
  out: Set<string>,
  prefix: string,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    out.add(path);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      walk(value as Record<string, unknown>, out, path);
    }
  }
}

export interface MetadataResource {
  attributes?: { metadata?: Record<string, unknown> };
}

/**
 * Memoized helper to collect the metadata keys from a container's loaded child
 * listings, for filter-key autocomplete.
 */
export function appContainerMetadataKeys(resources: MetadataResource[]): string[] {
  return collectMetadataKeys(resources.map((r) => r.attributes?.metadata));
}
