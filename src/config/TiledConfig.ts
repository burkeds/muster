/**
 * Configuration for the web client: where Tiled lives and how to authenticate.
 * All fields are optional; unset values fall back to sensible local defaults.
 */

export interface TiledConfig {
  /** Base URL of the Tiled API, e.g. http://localhost:8000/api/v1 or /api/v1 */
  tiledApiUrl?: string;
  /** Optional API key for single-user Tiled servers. */
  tiledApiKey?: string;
  /** Proxy mount for remote hosts (default "/tiled"). */
  proxyMount?: string;
  /** Master switch for the same-origin proxy (default true). */
  proxyEnabled?: boolean;
}

export const DEFAULT_TILED_BASE = 'http://localhost:8000/api/v1';

/** Normalize a URL: trim, strip trailing slash, auto-prepend a scheme. */
export function cleanUrl(raw: string | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  let value = raw.trim().replace(/\/+$/, '');
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) {
    // Relative path (e.g. /api/v1) — keep as-is for the dev proxy.
    if (value.startsWith('/')) return value;
    const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\]|[\d.]+)/.test(value);
    value = `${isLocalhost ? 'http' : 'https'}://${value}`;
  }
  return value;
}

/** Normalize a config object (used by the provider). */
export function cleanConfig(config: TiledConfig): TiledConfig {
  return {
    tiledApiUrl: cleanUrl(config.tiledApiUrl) ?? DEFAULT_TILED_BASE,
    tiledApiKey: config.tiledApiKey?.trim() || undefined,
  };
}
