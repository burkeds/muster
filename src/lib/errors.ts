import { TiledError } from '@tiled/client-core';

/** Rich, actionable guidance for a Tiled request failure. */
export interface HumanizedError {
  title: string;
  detail: string;
}

/**
 * Turn a thrown value (usually a TiledError) into a friendly title + explanation,
 * with specific guidance for CORS/network failures common with remote servers.
 */
export function humanizeError(err: unknown): HumanizedError {
  if (err instanceof TiledError && err.kind === 'cors') {
    return {
      title: 'Cross-origin request blocked',
      detail:
        'This server does not allow requests from this app origin (CORS). In development, remote ' +
        'servers are routed through the built-in same-origin proxy this app provides, so if you see ' +
        'this, the proxy may be disabled or the server unreachable through it. For a local server, ' +
        "start it with a permissive origin, e.g. TILED_ALLOW_ORIGINS='[\"http://localhost:5173\"]' tiled serve demo.",
    };
  }
  if (err instanceof TiledError && err.kind === 'network') {
    return {
      title: 'Could not reach the server',
      detail:
        'The network request failed. Check that the server is running/reachable and that the URL is ' +
        'correct. If a remote server does not allow cross-origin (CORS) requests, requests must go ' +
        'through a same-origin proxy.',
    };
  }
  if (err instanceof TiledError) {
    return {
      title: 'Tiled request failed',
      detail: err.message,
    };
  }
  return {
    title: 'Something went wrong',
    detail: err instanceof Error ? err.message : String(err),
  };
}
