/**
 * Runtime configuration bridge.
 *
 * In a containerized deployment a small `/config.js` (overwritten at startup
 * from environment variables) sets `window.__TILED_CONFIG__`. Reading it here
 * lets operators configure the Tiled server at run time without rebuilding.
 * When no runtime config is present (e.g. local dev) we fall back to the
 * build-time `VITE_*` environment variables inlined by Vite.
 */

export interface RuntimeTiledConfig {
  /** Base URL of the Tiled API, e.g. https://host/api/v1 or /api/v1. */
  apiUrl?: string;
  /** Optional API key for single-user Tiled servers. */
  apiKey?: string;
}

export interface EnvTiledConfig {
  apiUrl?: string;
  apiKey?: string;
}

declare global {
  interface Window {
    __TILED_CONFIG__?: RuntimeTiledConfig;
  }
}

/** Read the config injected at runtime by `/config.js` (if any). */
export function getRuntimeTiledConfig(): RuntimeTiledConfig {
  if (typeof window === 'undefined') {
    return {};
  }
  return window.__TILED_CONFIG__ ?? {};
}

/**
 * Resolve the effective env-driven Tiled config: runtime `/config.js` first,
 * then the build-time Vite env vars.
 */
export function resolveEnvTiledConfig(): EnvTiledConfig {
  const { apiUrl: runtimeUrl, apiKey: runtimeKey } = getRuntimeTiledConfig();
  return {
    apiUrl: runtimeUrl || import.meta.env.VITE_TILED_API_URL,
    apiKey: runtimeKey || import.meta.env.VITE_TILED_API_KEY,
  };
}
