import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { cleanUrl } from './TiledConfig';

const { mockCtor } = vi.hoisted(() => {
  const mockCtor = vi.fn(function MockTiledApiClient(
    this: { baseUrl?: string; apiKey?: string | null },
    config?: { baseUrl?: string; apiKey?: string | null },
  ) {
    this.baseUrl = config?.baseUrl;
    this.apiKey = config?.apiKey ?? null;
  });
  return { mockCtor };
});

vi.mock('@blueskyproject/tiled', () => ({
  TiledApiClient: mockCtor,
}));

import { TiledConfigProvider, useTiledConfig } from './TiledConfigProvider';

describe('cleanUrl', () => {
  it('strips trailing slashes', () => {
    expect(cleanUrl('http://localhost:8000/api/v1/')).toBe('http://localhost:8000/api/v1');
  });

  it('keeps relative paths for the dev proxy', () => {
    expect(cleanUrl('/api/v1')).toBe('/api/v1');
  });

  it('prepends http for localhost and https otherwise', () => {
    expect(cleanUrl('localhost:8000/api/v1')).toBe('http://localhost:8000/api/v1');
    expect(cleanUrl('example.com/api/v1')).toBe('https://example.com/api/v1');
  });

  it('returns undefined for empty input', () => {
    expect(cleanUrl('   ')).toBeUndefined();
    expect(cleanUrl(undefined)).toBeUndefined();
  });
});

describe('TiledConfigProvider client construction', () => {
  beforeEach(() => {
    mockCtor.mockClear();
  });

  it('constructs a TiledApiClient per config with baseUrl and apiKey', () => {
    let seen: { baseUrl?: string; apiKey?: string | null } | null = null;
    function Probe() {
      const cfg = useTiledConfig();
      useEffect(() => {
        seen = cfg.client as unknown as { baseUrl?: string; apiKey?: string | null };
      }, [cfg]);
      return null;
    }

    render(
      <TiledConfigProvider config={{ tiledApiUrl: 'http://s1:8000/api/v1', tiledApiKey: 'k1' }}>
        <Probe />
      </TiledConfigProvider>,
    );

    expect(mockCtor).toHaveBeenCalled();
    const arg = mockCtor.mock.calls[0][0] as { baseUrl: string; apiKey: string | null };
    expect(arg.baseUrl).toContain('s1');
    expect(arg.apiKey).toBe('k1');
    expect(seen).not.toBeNull();
  });

  it('recreates the client when the config server changes', () => {
    const { rerender } = render(
      <TiledConfigProvider config={{ tiledApiUrl: 'http://a:1/api/v1' }}>
        <span />
      </TiledConfigProvider>,
    );
    const firstCount = mockCtor.mock.calls.length;

    rerender(
      <TiledConfigProvider config={{ tiledApiUrl: 'http://b:2/api/v1' }}>
        <span />
      </TiledConfigProvider>,
    );

    expect(mockCtor.mock.calls.length).toBeGreaterThan(firstCount);
    const last = mockCtor.mock.calls[mockCtor.mock.calls.length - 1][0] as { baseUrl: string };
    expect(last.baseUrl).toContain('b');
  });
});
