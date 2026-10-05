/** Rewrites an absolute server-reported URL to a same-origin relative path. */
export function toRelative(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}
