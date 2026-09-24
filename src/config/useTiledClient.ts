import { useOptionalTiledConfig } from './TiledConfigProvider';
import type { TiledClient } from '@tiled/client-core';

/**
 * Returns the framework-agnostic TiledClient for the active configured server,
 * or null when no server/provider is mounted (never throws).
 */
export function useOptionalTiledClient(): TiledClient | null {
  return useOptionalTiledConfig()?.client ?? null;
}

/** Throws if no TiledConfigProvider (or active server) is mounted. */
export function useTiledClient(): TiledClient {
  const client = useOptionalTiledClient();
  if (!client) throw new Error('useTiledClient must be used within a TiledConfigProvider');
  return client;
}
