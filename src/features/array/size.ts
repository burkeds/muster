/** Soft warning threshold: raw bytes at/above this get an amber caution. */
export const WARN_BYTES = 100 * 1024 ** 2;
/** Hard warning threshold: raw bytes at/above this get a red "very large" notice. */
export const DANGER_BYTES = 1024 ** 3;

/** Parse an integer control value, or undefined when the field is empty. */
function parseIntOrUndef(s: string): number | undefined {
  const v = Number(Number.parseInt(s, 10));
  return Number.isNaN(v) || !s.trim() ? undefined : v;
}

/**
 * Number of elements selected along one axis of `size` by a numpy-style
 * control. Returns `null` when the control is not a valid index/slice.
 */
export function axisLength(control: string, size: number): number | null {
  const c = control.trim();
  if (c === '' || c === ':') return size;

  const colon = c.split(':');
  if (colon.length === 1) {
    // Bare index (e.g. "5" or "-3").
    const i = parseIntOrUndef(colon[0]);
    if (i === undefined) return null;
    const idx = i < 0 ? size + i : i;
    return idx >= 0 && idx < size ? 1 : null;
  }
  if (colon.length > 3) return null;

  const [aStr, bStr, stepStr] = colon;
  const start = aStr.trim() === '' ? undefined : parseIntOrUndef(aStr);
  const stop = bStr.trim() === '' ? undefined : parseIntOrUndef(bStr);
  const step = stepStr !== undefined && stepStr.trim() !== '' ? parseIntOrUndef(stepStr) : 1;
  if (step === undefined || step === 0) return null;

  const norm = (v: number | undefined, fallback: number): number => {
    if (v === undefined) return fallback;
    return v < 0 ? size + v : v;
  };
  // Clamp into [0, size].
  const clamp = (v: number) => Math.max(0, Math.min(size, v));

  if (step > 0) {
    const s = clamp(norm(start, 0));
    const e = clamp(norm(stop, size));
    if (e <= s) return 0;
    return Math.ceil((e - s) / step);
  }
  // Negative step.
  const s = clamp(norm(start, size - 1));
  const e = clamp(norm(stop, -1));
  if (s <= e) return 0;
  return Math.ceil((s - e) / Math.abs(step));
}

/**
 * Estimated number of elements for a request built from per-dimension controls.
 * Returns null when any axis is invalid (so the UI can show "unknown").
 */
export function estimateElements(controls: string[], shape: number[]): number | null {
  let total = 1;
  for (let i = 0; i < shape.length; i++) {
    const n = axisLength(controls[i] ?? '', shape[i]);
    if (n === null) return null;
    total *= n;
  }
  return total;
}

/** Raw (in-memory) byte size of `elements` values of the given itemsize. */
export function estimateBytes(elements: number, itemsize: number): number {
  return elements * itemsize;
}

/**
 * Approximate serialized size of `elements` values as an application/json
 * download. JSON numbers are far larger than the raw dtype, so use a per-value
 * factor that grows with the dtype width.
 */
export function estimateJsonTextBytes(elements: number, itemsize: number): number {
  const perValue = 2 + itemsize * 2;
  return elements * perValue;
}

/** Human-friendly byte size, e.g. "2.7 MB", "1.2 GB". */
export function humanBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '?';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  const digits = v >= 100 || u === 0 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(digits)} ${units[u]}`;
}
