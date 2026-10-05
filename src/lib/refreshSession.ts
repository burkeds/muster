/**
 * Session-refresh helper for Tiled's sliding-session auth flow.
 *
 * Ported from the archived `@tiled/client-core` package (`src/auth.ts` /
 * `src/client.ts`) — `TiledApiClient` (from `@blueskyproject/tiled`) exposes
 * no public manual-refresh method, only a private `doTokenRefresh` used
 * internally by its 401 interceptor. This pure, framework-agnostic function
 * covers the explicit "restore session on mount" flow.
 */

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  token_type?: string;
}

interface AboutAuthentication {
  links?: {
    refresh_session?: string;
  };
}

interface About {
  authentication: AboutAuthentication;
}

export interface RefreshSessionArgs {
  base: string;
  refreshToken: string;
  signal?: AbortSignal;
}

/** GET {base}/ — discover the server's advertised refresh-session endpoint. */
async function discoverRefreshUrl(base: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${base.replace(/\/+$/, '')}/`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error(`Discovery failed (${res.status})`);
  const data = (await res.json()) as About;
  const refreshUrl = data.authentication?.links?.refresh_session;
  if (!refreshUrl) throw new Error('No refresh_session link advertised');
  return refreshUrl;
}

/** POST /auth/session/refresh — rotate a sliding auth session. */
export async function refreshSession(args: RefreshSessionArgs): Promise<AuthTokens> {
  const refreshUrl = await discoverRefreshUrl(args.base, args.signal);
  const res = await fetch(refreshUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: args.refreshToken }),
    signal: args.signal,
  });
  if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
  return (await res.json()) as AuthTokens;
}
