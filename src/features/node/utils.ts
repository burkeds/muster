/** Human-readable dimension shape, e.g. [3, 5]. */
export function formatShape(shape: number[] | undefined): string {
  return shape && shape.length ? `[${shape.join(", ")}]` : "—";
}

/**
 * Whether a listed resource is flagged as an empty container (a container with
 * no data children — no containers, arrays, or tables). Uses `structure.count`
 * (populated when the listing requests `fields=structure`).
 *
 * Only an explicit `count === 0` is treated as empty. A missing/`undefined`
 * count (server did not return `structure`, or the adapter does not populate
 * it) is treated as *unknown* and therefore non-empty, so a container is never
 * hidden without the server asserting it has no children. `count === 0` is a
 * candidate that callers may verify against a live listing before hiding (see
 * `useVerifiedEmptyContainers`), since some catalogs under-report count while
 * still serving children.
 */
export function isContainerEmpty(resource: {
  attributes: { structure_family?: string; structure?: unknown };
}): boolean {
  if (resource.attributes.structure_family !== "container") return false;
  const count = (
    resource.attributes.structure as { count?: number } | undefined
  )?.count;
  return count === 0;
}

/** Build a numpy slice string selecting the trailing 2 dims: e.g. 0,0,:,: */
export function trailing2DSlice(ndim: number): string {
  if (ndim <= 2) return "";
  const fixed = Array.from({ length: ndim - 2 }, () => "0").join(",");
  return fixed ? `${fixed},:,:` : "";
}
