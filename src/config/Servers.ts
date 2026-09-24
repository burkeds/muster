import { cleanUrl } from './TiledConfig';

export interface Server {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
}

const SERVERS_KEY = 'tiled_servers';
const ACTIVE_KEY = 'tiled_active_server_id';

/** Servers pre-seeded on first launch. */
export const DEFAULT_SERVERS: Server[] = [
  { id: 'local-demo', name: 'Local demo', url: 'http://localhost:8000/api/v1' },
  { id: 'nsls2-demo', name: 'NSLS-II demo', url: 'https://tiled-demo.nsls2.bnl.gov/api/v1' },
  { id: 'desy', name: 'DESY', url: 'https://tiled.desy.de/api/v1' },
];

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/** Load the saved server list from localStorage (falling back to defaults). */
export function loadServers(envUrl?: string, envApiKey?: string): Server[] {
  const stored = localStorage.getItem(SERVERS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Server[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* ignore corrupt storage */
    }
  }
  const normalized = cleanUrl(envUrl);
  const seeds = [...DEFAULT_SERVERS];
  if (normalized && !seeds.some((s) => s.url === normalized)) {
    seeds.push({
      id: 'env',
      name: 'Configured server',
      url: normalized,
      apiKey: envApiKey?.trim() || undefined,
    });
  }
  return seeds;
}

export function persistServers(servers: Server[]): void {
  localStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
}

export function loadActiveServerId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function persistActiveServerId(id: string | null): void {
  if (id === null) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, id);
}

/** Normalize + validate a user-entered server URL/API key into a Server. */
export function buildServer(name: string, rawUrl: string, apiKey?: string): Server {
  const url = cleanUrl(rawUrl);
  if (!url) {
    throw new Error('Please enter a valid Tiled URL (e.g. https://host/api/v1).');
  }
  // Relative paths are allowed: they address a same-origin base (e.g. a proxy).
  if (url.startsWith('/')) {
    return {
      id: '',
      name: name.trim() || url,
      url,
      apiKey: apiKey?.trim() || undefined,
    };
  }
  if (!isValidUrl(url)) {
    throw new Error('Please enter a valid absolute Tiled URL (e.g. https://host/api/v1).');
  }
  return {
    id: '',
    name: name.trim() || hostFromUrl(url),
    url,
    apiKey: apiKey?.trim() || undefined,
  };
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function makeServerId(url: string): string {
  return `srv-${url.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x'}`;
}
