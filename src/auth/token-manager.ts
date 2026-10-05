import type { UserIdentity } from './types';

/**
 * Token storage is namespaced per Tiled server URL so that switching servers
 * never leaks one server's credentials to another. Use `scopeTokens(scope)` to
 * point a manager at a specific server, or `defaultTokenManager` otherwise.
 *
 * Note: `@blueskyproject/tiled`'s internal 401 interceptor reads *global*
 * localStorage keys (`tiledAccessToken` / `tiledRefreshToken`). Call
 * `syncSdkTokenStore` whenever the active server's tokens change so that
 * interceptor stays aligned with the scoped store for the *current* server only.
 */
let ACCESS_KEY = 'tiled_access_token';
let REFRESH_KEY = 'tiled_refresh_token';
let IDENTITY_KEY = 'tiled_identity';

/** Global keys used by `@blueskyproject/tiled` TiledApiClient auto-refresh. */
const SDK_ACCESS_KEY = 'tiledAccessToken';
const SDK_REFRESH_KEY = 'tiledRefreshToken';

/** Derive a stable scope suffix from a server URL. */
export function scopeForServer(url: string): string {
  try {
    return new URL(url).hostname + ':' + new URL(url).port;
  } catch {
    return url;
  }
}

/** Re-key the module-level storage prefix for a server scope. */
export function scopeTokens(scope: string): void {
  const suffix = `:${scope}`;
  ACCESS_KEY = `tiled_access_token${suffix}`;
  REFRESH_KEY = `tiled_refresh_token${suffix}`;
  IDENTITY_KEY = `tiled_identity${suffix}`;
}

/**
 * Mirror (or clear) the active session into the SDK's global token keys so the
 * private `doTokenRefresh` interceptor can refresh on HTTP 401 for the *active*
 * server. Never a substitute for the scoped `tokenManager` — multi-server
 * isolation still lives there.
 */
export function syncSdkTokenStore(accessToken: string | null, refreshToken: string | null): void {
  if (typeof window === 'undefined') return;
  if (accessToken && refreshToken) {
    localStorage.setItem(SDK_ACCESS_KEY, accessToken);
    localStorage.setItem(SDK_REFRESH_KEY, refreshToken);
  } else {
    localStorage.removeItem(SDK_ACCESS_KEY);
    localStorage.removeItem(SDK_REFRESH_KEY);
  }
}

/** Decode the `exp` (and iat) from a JWT payload. Returns null if absent/invalid. */
export function parseJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = atob(
      parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(parts[1].length + ((4 - (parts[1].length % 4)) % 4), '='),
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function tokenExpiry(token: string): number | null {
  const payload = parseJwtPayload<{ exp?: number }>(token);
  return payload?.exp ? payload.exp * 1000 : null;
}

/** True if the token has already expired (with a small clock skew buffer). */
export function isTokenExpired(token: string, skewMs = 30_000): boolean {
  const exp = tokenExpiry(token);
  return exp === null ? false : Date.now() > exp - skewMs;
}

export function tokenHasExpiry(token: string): boolean {
  return tokenExpiry(token) !== null;
}

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
  identity: UserIdentity | null;
}

export const tokenManager = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  getIdentity(): UserIdentity | null {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserIdentity;
    } catch {
      return null;
    }
  },
  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    syncSdkTokenStore(accessToken, refreshToken);
  },
  saveIdentity(identity: UserIdentity): void {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(IDENTITY_KEY);
    syncSdkTokenStore(null, null);
  },
  hydrate(): StoredTokens {
    return {
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken(),
      identity: this.getIdentity(),
    };
  },
};
