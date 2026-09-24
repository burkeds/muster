import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_SERVERS,
  loadServers,
  persistServers,
  loadActiveServerId,
  persistActiveServerId,
  buildServer,
  makeServerId,
} from './Servers';

describe('loadServers', () => {
  beforeEach(() => localStorage.clear());

  it('returns the pre-seeded default list on first launch', () => {
    const servers = loadServers();
    const urls = servers.map((s) => s.url);
    expect(urls).toContain('http://localhost:8000/api/v1');
    expect(urls).toContain('https://tiled-demo.nsls2.bnl.gov/api/v1');
    expect(urls).toContain('https://tiled.desy.de/api/v1');
  });

  it('adds a distinct env server to the defaults', () => {
    const servers = loadServers('http://internal:7000/api/v1');
    expect(servers.map((s) => s.url)).toContain('http://internal:7000/api/v1');
  });

  it('loads persisted servers from localStorage', () => {
    const custom = [{ id: 'a', name: 'A', url: 'http://a/api/v1' }];
    persistServers(custom);
    expect(loadServers()).toEqual(custom);
  });

  it('ignores corrupt storage and falls back to defaults', () => {
    localStorage.setItem('tiled_servers', '{not json');
    expect(loadServers().length).toBe(DEFAULT_SERVERS.length);
  });
});

describe('active server persistence', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips the active server id', () => {
    expect(loadActiveServerId()).toBeNull();
    persistActiveServerId('desy');
    expect(loadActiveServerId()).toBe('desy');
    persistActiveServerId(null);
    expect(loadActiveServerId()).toBeNull();
  });
});

describe('buildServer', () => {
  it('validates and normalizes a URL', () => {
    const server = buildServer('My', ' localhost:8000/api/v1/ ');
    expect(server.url).toBe('http://localhost:8000/api/v1');
    expect(server.name).toBe('My');
  });

  it('rejects malformed URLs but allows relative same-origin paths', () => {
    // Relative paths (a same-origin/proxied base) are allowed.
    const rel = buildServer('x', '/api/v1');
    expect(rel.url).toBe('/api/v1');
    expect(() => buildServer('x', 'not a url')).toThrow();
  });

  it('derives a name from the host when none given', () => {
    const server = buildServer('   ', 'https://example.com/api/v1');
    expect(server.name).toBe('example.com');
  });
});

describe('makeServerId', () => {
  it('is stable and slug-like', () => {
    expect(makeServerId('http://a/api/v1')).toBe(makeServerId('http://a/api/v1'));
  });
});

describe('loadServers uses environment', () => {
  beforeEach(() => localStorage.clear());
  it('passes env api key through to the env server', () => {
    const servers = loadServers('http://k/api/v1', 'secret');
    const env = servers.find((s) => s.id === 'env');
    expect(env?.apiKey).toBe('secret');
  });
});
