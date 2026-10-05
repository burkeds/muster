import { toRelative } from '@/lib/toRelative';

/**
 * Proxy-aware URL resolution.
 *
 * Tiled servers block cross-origin browser reads by default (allow_origins is
 * empty). To reach remote servers from a browser we route API calls through a
 * same-origin proxy mounted at `proxyMount` with the remote host encoded in the
 * path:  /tiled/<host>/<rest>
 *
 * A configured "server URL" is the real, user-facing Tiled base (an absolute
 * URL or a relative same-origin path). From it we derive the *effective* base
 * that requests actually run against.
 */

export const DEFAULT_PROXY_MOUNT = '/tiled';

export interface ProxyOptions {
  /** Proxy mount prefix, e.g. "/tiled". Empty string disables proxying. */
  proxyMount?: string;
  /** Set false to disable proxying entirely (use direct URLs). */
  proxyEnabled?: boolean;
}

function getWindowOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
}

export function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1'
  );
}

function splitHostPath(urlStr: string): { host: string; pathname: string } | null {
  try {
    const u = new URL(urlStr);
    return { host: u.host, pathname: u.pathname };
  } catch {
    return null;
  }
}

/**
 * Compute the effective base URL for requests given a configured server base.
 *  - relative paths (e.g. "/api/v1") are already same-origin → returned as-is.
 *  - loopback hosts are used directly (CORS must be server-configured).
 *  - other remote hosts are mounted under the proxy: `/tiled/<host><path>`.
 */
export function resolveEffectiveBase(
  remoteUrl: string,
  opts: ProxyOptions = {},
): { effective: string; isProxied: boolean } {
  if (remoteUrl.startsWith('/')) {
    return { effective: remoteUrl, isProxied: false };
  }
  const mount = opts.proxyMount ?? DEFAULT_PROXY_MOUNT;
  const enabled = opts.proxyEnabled ?? true;
  const parsed = splitHostPath(remoteUrl);
  if (!parsed) return { effective: remoteUrl, isProxied: false };
  if (!enabled || !mount || isLoopbackHost(parsed.host.split(':')[0])) {
    return { effective: remoteUrl, isProxied: false };
  }
  return {
    effective: `${mount}/${parsed.host}${parsed.pathname}`,
    isProxied: true,
  };
}

/**
 * Rewrite a server-reported (absolute) link so it runs through the same path
 * the client uses. For proxied bases this re-encodes the link's own host under
 * the proxy mount; otherwise it becomes a bare same-origin relative path.
 */
export function rewriteLink(link: string, effectiveBase: string, proxyMount = DEFAULT_PROXY_MOUNT): string {
  if (effectiveBase.startsWith(`${proxyMount}/`)) {
    const parsed = splitHostPath(link);
    if (parsed) return `${proxyMount}/${parsed.host}${parsed.pathname}${searchOf(link)}`;
    return toRelative(link);
  }
  return toRelative(link);
}

function searchOf(urlStr: string): string {
  try {
    return new URL(urlStr).search;
  } catch {
    return '';
  }
}

/** Resolve a (possibly relative) base into an absolute URL for `new URL()`. */
export function resolveAbsolute(base: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(base)) return base;
  return `${getWindowOrigin()}${base}`;
}

/** Human "proxied" form of a server base, e.g. url shown in the UI. */
export function displayUrl(remoteUrl: string): string {
  return remoteUrl;
}
