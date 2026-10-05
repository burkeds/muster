import { useOptionalTiledConfig } from './TiledConfigProvider';
import type { TiledApiClient } from '@blueskyproject/tiled';

/**
 * Returns the TiledApiClient for the active configured server,
 * or null when no server/provider is mounted (never throws).
 */
export function useOptionalTiledClient(): TiledApiClient | null {
  return useOptionalTiledConfig()?.client ?? null;
}

/** Throws if no TiledConfigProvider (or active server) is mounted. */
export function useTiledClient(): TiledApiClient {
  const client = useOptionalTiledClient();
  if (!client) throw new Error('useTiledClient must be used within a TiledConfigProvider');
  return client;
}
