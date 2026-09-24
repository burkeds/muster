/** Number of leading (non-plot) dimensions for an ndim array. */
export function leadingDimCount(ndim: number): number {
  return Math.max(0, ndim - 2);
}

/** Validate a single dimension control: an index or a numpy-style slice. */
export function isValidSliceControl(value: string): boolean {
  if (value.trim() === '') return true;
  // e.g. "5", ":", "1:8", ":10", "::2", "-50:", "0:10:2"
  return /^-?\d*(?::(-?\d*)?(?::-?\d*)?)?$/.test(value.trim());
}

/** Initial per-dimension controls: empty strings mean "entire dimension". */
export function sliceControlsInitial(ndim: number): string[] {
  return Array.from({ length: Math.max(0, ndim) }, () => '');
}

/** True when every dimension control requests the whole axis. */
export function isWholeArray(controls: string[]): boolean {
  return controls.every((c) => {
    const v = c.trim();
    return v === '' || v === ':';
  });
}

/**
 * Build a numpy slice string from per-dimension controls for an ndim array.
 * Empty controls represent the whole axis (":"). Returns `undefined` when the
 * whole array is requested (no `slice` parameter should be sent to the server).
 */
export function buildSliceString(controls: string[], ndim: number): string | undefined {
  const dims = Array.from({ length: Math.max(0, ndim) }, (_, i) => {
    const v = (controls[i] ?? '').trim();
    return v === '' ? ':' : v;
  });
  if (dims.length === 0 || dims.every((d) => d === ':')) return undefined;
  return dims.join(',');
}

/**
 * Convenience for N-D arrays (>=3D): scalar indices for every dimension except
 * the last two, which stay whole (":") so the result is a clean 2-D frame.
 */
export function firstFrameControls(ndim: number): string[] {
  const n = Math.max(0, ndim);
  if (n <= 2) return Array.from({ length: n }, () => ':');
  return Array.from({ length: n }, (_, i) => (i < n - 2 ? '0' : ':'));
}

/**
 * Reduce a (possibly higher-rank) nested array to 2-D by dropping the leading
 * axes, so heatmap/contour/surface traces always receive a 2-D block. Used as a
 * safety fallback when a user requests a whole/sliced N-D array.
 */
export function to2D(data: unknown): unknown[][] {
  let depth = 0;
  let probe: unknown = data;
  while (Array.isArray(probe) && Array.isArray(probe[0])) {
    depth++;
    probe = probe[0];
  }
  depth++;

  let block: unknown = data;
  while (depth > 2) {
    if (Array.isArray(block) && (block as unknown[]).length) block = (block as unknown[])[0];
    else break;
    depth--;
  }

  const arr = block as unknown[];
  if (!Array.isArray(arr)) return [[block]];
  if (arr.length && Array.isArray(arr[0])) return arr as unknown[][];
  return [arr];
}
