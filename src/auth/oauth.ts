import type { UserIdentity } from './types';

/**
 * Build the URL the browser should navigate (or open in a new tab) to start an
 * external OIDC authorization-code login. Accepts both absolute and relative
 * (proxied) endpoints. Appends `state` without relying on `new URL`, so
 * relative same-origin/proxy paths don't throw.
 */
export function buildExternalAuthUrl(endpoint: string, state: string): string {
  const sep = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${sep}state=${encodeURIComponent(state)}`;
}

export interface ParsedAuthCallback {
  accessToken?: string;
  refreshToken?: string;
  identity?: UserIdentity;
  state?: string;
}

/**
 * Parse an OAuth2/OIDC callback query string into tokens + identity + state.
 * Tiled's server returns `access_token`, `refresh_token`, `identity.id`,
 * `identity.provider` (plus `principal`), and the original `state`.
 */
export function parseAuthCallbackParams(search: string): ParsedAuthCallback {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const accessToken = params.get('access_token') ?? undefined;
  const refreshToken = params.get('refresh_token') ?? undefined;
  const state = params.get('state') ?? undefined;

  const identityId = params.get('identity.id');
  const identityProvider = params.get('identity.provider');

  let identity: UserIdentity | undefined;
  if (identityId) {
    identity = { id: identityId, ...(identityProvider ? { provider: identityProvider } : {}) };
  } else {
    // Some deployments pass a serialized identity object.
    const raw = params.get('identity') ?? params.get('user');
    if (raw) {
      try {
        identity = JSON.parse(decodeURIComponent(raw)) as UserIdentity;
      } catch {
        identity = { id: raw };
      }
    }
  }

  return { accessToken, refreshToken, identity, state };
}

export interface AuthCallbackPayload {
  access_token: string;
  refresh_token: string;
  identity?: UserIdentity;
  /** Where to navigate after a successful login. */
  target: string;
}

/**
 * Turn a parsed callback into the login payload the auth provider consumes,
 * resolving the post-login target from `state` (a relative path like `/browse`)
 * and defaulting to `.browse`.
 */
export function buildCallbackPayload(parsed: ParsedAuthCallback): AuthCallbackPayload | null {
  if (!parsed.accessToken || !parsed.refreshToken) return null;
  return {
    access_token: parsed.accessToken,
    refresh_token: parsed.refreshToken,
    identity: parsed.identity,
    target:
      parsed.state && parsed.state.startsWith('/') ? parsed.state : '/browse',
  };
}
