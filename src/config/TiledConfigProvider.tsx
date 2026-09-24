import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { cleanConfig, DEFAULT_TILED_BASE, type TiledConfig } from './TiledConfig';
import { resolveEffectiveBase, rewriteLink, DEFAULT_PROXY_MOUNT } from './proxy';
import { TiledClient } from '@tiled/client-core';
import { tokenManager } from '@/auth/token-manager';

export interface TiledConfigValue extends TiledConfig {
  /** Effective base used for requests (possibly proxied). */
  tiledApiUrl: string;
  /** The raw, user-facing base the user configured. */
  remoteTiledApiUrl: string;
  isProxied: boolean;
  proxyMount: string;
  /** Rewrite a server-reported absolute link to the client's path scheme. */
  linkRewrite: (url: string) => string;
  /** Framework-agnostic Tiled client bound to this configured server. */
  client: TiledClient;
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
    const client = new TiledClient({
      baseUrl: effective,
      apiKey: cleaned.tiledApiKey,
      getBearerToken: () => tokenManager.getAccessToken(),
      linkRewrite,
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
