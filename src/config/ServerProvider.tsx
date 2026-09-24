import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  buildServer,
  loadActiveServerId,
  loadServers,
  makeServerId,
  persistActiveServerId,
  persistServers,
  type Server,
} from './Servers';
import { TiledConfigProvider } from './TiledConfigProvider';

export interface ServersValue {
  servers: Server[];
  activeServer: Server | null;
  selectServer: (id: string) => void;
  addServer: (name: string, url: string, apiKey?: string) => Server;
  updateServer: (id: string, patch: Partial<Omit<Server, 'id'>>) => void;
  removeServer: (id: string) => void;
}

const ServersContext = createContext<ServersValue | null>(null);

export interface ServerProviderProps {
  /** Bootstrap server from env vars, applied only on first launch. */
  envUrl?: string;
  envApiKey?: string;
  children: ReactNode;
}

/** Manages the list of Tiled servers + the active one, feeding TiledConfig. */
export function ServerProvider({ envUrl, envApiKey, children }: ServerProviderProps) {
  const [servers, setServers] = useState<Server[]>(() =>
    loadServers(envUrl, envApiKey),
  );
  // Env bootstrap: if an env server is provided and nothing was persisted, select it.
  const [activeId, setActiveId] = useState<string | null>(() => {
    const saved = loadActiveServerId();
    if (saved) return saved;
    const stored = localStorage.getItem('tiled_servers');
    if (!stored && envUrl) return 'env';
    return null;
  });

  const activeServer = useMemo(
    () => servers.find((s) => s.id === activeId) ?? null,
    [servers, activeId],
  );

  const selectServer = (id: string) => {
    setActiveId(id);
    persistActiveServerId(id);
  };

  const addServer = (name: string, url: string, apiKey?: string): Server => {
    const built = buildServer(name, url, apiKey);
    const id = makeServerId(built.url);
    built.id = id;
    setServers((prev) => {
      const exists = prev.some((s) => s.id === id);
      const next = exists
        ? prev.map((s) => (s.id === id ? built : s))
        : [...prev, built];
      persistServers(next);
      return next;
    });
    return built;
  };

  const updateServer = (id: string, patch: Partial<Omit<Server, 'id'>>) => {
    setServers((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      persistServers(next);
      return next;
    });
  };

  const removeServer = (id: string) => {
    setServers((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistServers(next);
      return next;
    });
    if (activeId === id) {
      setActiveId(null);
      persistActiveServerId(null);
    }
  };

  const value: ServersValue = {
    servers,
    activeServer,
    selectServer,
    addServer,
    updateServer,
    removeServer,
  };

  return (
    <ServersContext.Provider value={value}>
      <TiledConfigProvider
        config={
          activeServer
            ? { tiledApiUrl: activeServer.url, tiledApiKey: activeServer.apiKey }
            : undefined
        }
      >
        {children}
      </TiledConfigProvider>
    </ServersContext.Provider>
  );
}

export function useServers(): ServersValue {
  const ctx = useContext(ServersContext);
  if (!ctx) throw new Error('useServers must be used within a ServerProvider');
  return ctx;
}

export function useServersOptional(): ServersValue | null {
  return useContext(ServersContext);
}
