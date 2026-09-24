import { afterEach, describe, expect, it } from 'vitest';

import { getRuntimeTiledConfig, resolveEnvTiledConfig } from './runtimeConfig';

const env = import.meta.env as {
  VITE_TILED_API_URL?: string;
  VITE_TILED_API_KEY?: string;
};

afterEach(() => {
  delete window.__TILED_CONFIG__;
  delete env.VITE_TILED_API_URL;
  delete env.VITE_TILED_API_KEY;
});

describe('getRuntimeTiledConfig', () => {
  it('reads the config injected by /config.js', () => {
    window.__TILED_CONFIG__ = { apiUrl: 'https://host/api/v1', apiKey: 'k' };
    expect(getRuntimeTiledConfig()).toEqual({ apiUrl: 'https://host/api/v1', apiKey: 'k' });
  });

  it('returns an empty object when nothing is injected', () => {
    expect(getRuntimeTiledConfig()).toEqual({});
  });
});

describe('resolveEnvTiledConfig', () => {
  it('prefers the runtime config over build-time env', () => {
    env.VITE_TILED_API_URL = 'https://build.example/api/v1';
    env.VITE_TILED_API_KEY = 'build-key';
    window.__TILED_CONFIG__ = { apiUrl: 'https://runtime.example/api/v1' };

    expect(resolveEnvTiledConfig()).toEqual({
      apiUrl: 'https://runtime.example/api/v1',
      apiKey: 'build-key',
    });
  });

  it('falls back to build-time env when no runtime config is set', () => {
    env.VITE_TILED_API_URL = 'https://build.example/api/v1';
    env.VITE_TILED_API_KEY = 'build-key';

    expect(resolveEnvTiledConfig()).toEqual({
      apiUrl: 'https://build.example/api/v1',
      apiKey: 'build-key',
    });
  });

  it('returns an empty config when neither is present', () => {
    expect(resolveEnvTiledConfig()).toEqual({ apiUrl: undefined, apiKey: undefined });
  });
});
