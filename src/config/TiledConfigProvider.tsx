import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { TiledApiClient } from '@blueskyproject/tiled';
import { cleanConfig, DEFAULT_TILED_BASE, type TiledConfig } from './TiledConfig';
import { resolveEffectiveBase, rewriteLink, DEFAULT_PROXY_MOUNT } from './proxy';

export interface TiledConfigValue extends TiledConfig {
  /** Effective base used for requests (possibly proxied). */
  tiledApiUrl: string;
  /** The raw, user-facing base the user configured. */
  remoteTiledApiUrl: string;
  isProxied: boolean;
  proxyMount: string;
  /** Rewrite a server-reported absolute link to the client's path scheme. */
  linkRewrite: (url: string) => string;
  /**
   * Per-active-server Tiled API client (`TiledApiClient` from `@blueskyproject/tiled`).
   * Re-created whenever the active server/config changes so multi-server state stays isolated.
   */
  client: TiledApiClient;
}

const TiledConfigContext = createContext<TiledConfigValue | null>(null);

export interface TiledConfigProviderProps {
  config?: TiledConfig;
  children: ReactNode;
}

/** Provides backend URLs/keys (including proxy-aware resolution) to the tree. */
export function TiledConfigProvider({ config, children }: TiledConfigProviderProps) {
  const value = useMemo<TiledConfigValue>(() => {
    const cleaned = cleanConfig(config ?? {});
    const remoteTiledApiUrl = cleaned.tiledApiUrl ?? DEFAULT_TILED_BASE;
    const proxyMount = cleaned.proxyMount?.trim() || DEFAULT_PROXY_MOUNT;
    const proxyEnabled = cleaned.proxyEnabled ?? true;
    const { effective, isProxied } = resolveEffectiveBase(remoteTiledApiUrl, {
      proxyMount,
      proxyEnabled,
    });
    const linkRewrite = (url: string) => rewriteLink(url, effective, proxyMount);
    // Explicit per-server instance — never the package's global default client.
    // Note: TiledApiClient has no linkRewrite/getBearerToken constructor options;
    // bearer tokens are pushed imperatively via setBearerToken (see AuthProvider).
    const client = new TiledApiClient({
      baseUrl: effective,
      apiKey: cleaned.tiledApiKey ?? null,
    });
    return {
      ...cleaned,
      tiledApiUrl: effective,
      remoteTiledApiUrl,
      isProxied,
      proxyMount,
      linkRewrite,
      client,
    };
  }, [config]);

  return <TiledConfigContext.Provider value={value}>{children}</TiledConfigContext.Provider>;
}

/** Returns config or null when no provider is mounted (no throw). */
export function useOptionalTiledConfig(): TiledConfigValue | null {
  return useContext(TiledConfigContext);
}

/** Throws if no provider is mounted. */
export function useTiledConfig(): TiledConfigValue {
  const ctx = useContext(TiledConfigContext);
  if (!ctx) throw new Error('useTiledConfig must be used within a TiledConfigProvider');
  return ctx;
}
