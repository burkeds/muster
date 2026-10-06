import { describe, it, expect, vi, afterEach } from 'vitest';
import type { TiledAuthProvider } from '@blueskyproject/tiled';

import { startDeviceCodeAuth, type DeviceCodeResponse } from './deviceCodeAuth';

const provider = (
  auth_endpoint: string,
): TiledAuthProvider => ({
  provider: 'keycloak_oidc',
  mode: 'external',
  links: { auth_endpoint },
  confirmation_message: '',
});

const device = (overrides: Partial<DeviceCodeResponse> = {}): DeviceCodeResponse => ({
  authorization_uri: 'https://keycloak.example.com/auth',
  verification_uri: 'https://tiled.example.com/api/v1/auth/provider/keycloak_oidc/verify',
  interval: 2,
  expires_in: 900,
  device_code: 'dc',
  user_code: 'ABCD-EFGH',
  ...overrides,
});

function jsonResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => data,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('startDeviceCodeAuth', () => {
  it('rewrites the auth_endpoint through the proxy before POSTing', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(device()));
    vi.stubGlobal('fetch', fetchMock);

    const rewrite = (url: string) =>
      url.replace('https://tiled.example.com', '/tiled/tiled.example.com');

    const data = await startDeviceCodeAuth({
      provider: provider('https://tiled.example.com/api/v1/auth/provider/keycloak_oidc/authorize'),
      rewrite,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      '/tiled/tiled.example.com/api/v1/auth/provider/keycloak_oidc/authorize',
    );
    expect(init.method).toBe('POST');
    expect(data.verification_uri).toBe(
      '/tiled/tiled.example.com/api/v1/auth/provider/keycloak_oidc/verify',
    );
    // The Keycloak authorization_uri is deliberately left cross-origin.
    expect(data.authorization_uri).toBe('https://keycloak.example.com/auth');
  });

  it('leaves already-relative endpoints unchanged', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(device()));
    vi.stubGlobal('fetch', fetchMock);

    await startDeviceCodeAuth({
      provider: provider('/api/v1/auth/provider/keycloak_oidc/authorize'),
      rewrite: (url) => url,
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/v1/auth/provider/keycloak_oidc/authorize',
    );
  });

  it('maps a network/CORS rejection to a friendly message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    await expect(
      startDeviceCodeAuth({
        provider: provider('https://tiled.example.com/api/v1/auth/provider/keycloak_oidc/authorize'),
        rewrite: (url) => url,
      }),
    ).rejects.toThrow(
      'Cannot reach the authentication endpoint (CORS or network). Failed to fetch',
    );
  });

  it('surfaces a non-OK response with the status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false, 500)));
    await expect(
      startDeviceCodeAuth({
        provider: provider('https://tiled.example.com/api/v1/auth/provider/keycloak_oidc/authorize'),
        rewrite: (url) => url,
      }),
    ).rejects.toThrow('Cannot start device login (500)');
  });
});
