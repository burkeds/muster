/** Human-readable dimension shape, e.g. [3, 5]. */
export function formatShape(shape: number[] | undefined): string {
  return shape && shape.length ? `[${shape.join(', ')}]` : '—';
}

/**
 * Whether a listed resource is an empty container (a container with no data
 * children — no containers, arrays, or tables). Uses `structure.count` (populated
 * when the listing requests `fields=structure`).
 */
export function isContainerEmpty(resource: {
  attributes: { structure_family?: string; structure?: unknown };
}): boolean {
  if (resource.attributes.structure_family !== 'container') return false;
  const count = (resource.attributes.structure as { count?: number } | undefined)?.count;
  return (count ?? 0) === 0;
}

/** Build a numpy slice string selecting the trailing 2 dims: e.g. 0,0,:,: */
export function trailing2DSlice(ndim: number): string {
  if (ndim <= 2) return '';
  const fixed = Array.from({ length: ndim - 2 }, () => '0').join(',');
  return fixed ? `${fixed},:,:` : '';
}
