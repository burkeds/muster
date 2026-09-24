import { describe, it, expect } from 'vitest';
import { buildCallbackPayload, buildExternalAuthUrl, parseAuthCallbackParams } from './oauth';

describe('buildExternalAuthUrl', () => {
  it('appends state to an absolute endpoint', () => {
    const url = buildExternalAuthUrl(
      'https://tiled.desy.de/api/v1/auth/provider/keycloak_oidc/authorize',
      '/browse',
    );
    expect(url).toBe(
      'https://tiled.desy.de/api/v1/auth/provider/keycloak_oidc/authorize?state=%2Fbrowse',
    );
  });

  it('appends state to a relative proxied endpoint without throwing', () => {
    const url = buildExternalAuthUrl(
      '/tiled/tiled.desy.de/api/v1/auth/provider/keycloak_oidc/authorize',
      '/browse',
    );
    expect(url).toBe(
      '/tiled/tiled.desy.de/api/v1/auth/provider/keycloak_oidc/authorize?state=%2Fbrowse',
    );
  });

  it('uses & when the endpoint already has a query string', () => {
    const url = buildExternalAuthUrl('https://h/authorize?extra=1', '/x');
    expect(url).toContain('&state=');
  });
});

describe('parseAuthCallbackParams', () => {
  it('parses tokens and Tiled-style identity.id/provider', () => {
    const parsed = parseAuthCallbackParams(
      '?access_token=AT&refresh_token=RT&identity.id=alice&identity.provider=keycloak_oidc&state=/browse',
    );
    expect(parsed.accessToken).toBe('AT');
    expect(parsed.refreshToken).toBe('RT');
    expect(parsed.identity).toEqual({ id: 'alice', provider: 'keycloak_oidc' });
    expect(parsed.state).toBe('/browse');
  });

  it('parses a serialized identity object', () => {
    const encoded = encodeURIComponent(JSON.stringify({ id: 'bob' }));
    const parsed = parseAuthCallbackParams(`?identity=${encoded}`);
    expect(parsed.identity).toEqual({ id: 'bob' });
  });

  it('returns undefined for missing tokens', () => {
    const parsed = parseAuthCallbackParams('');
    expect(parsed.accessToken).toBeUndefined();
    expect(parsed.refreshToken).toBeUndefined();
  });
});

describe('buildCallbackPayload', () => {
  it('builds a payload from parsed tokens', () => {
    const payload = buildCallbackPayload(
      parseAuthCallbackParams(
        '?access_token=AT&refresh_token=RT&identity.id=alice&identity.provider=keycloak_oidc',
      ),
    );
    expect(payload).toEqual({
      access_token: 'AT',
      refresh_token: 'RT',
      identity: { id: 'alice', provider: 'keycloak_oidc' },
      target: '/browse',
    });
  });

  it('returns null when tokens are missing', () => {
    expect(buildCallbackPayload(parseAuthCallbackParams('?identity.id=alice'))).toBeNull();
  });

  it('honours a relative state as the target', () => {
    const payload = buildCallbackPayload(
      parseAuthCallbackParams('?access_token=AT&refresh_token=RT&state=/node/x'),
    );
    expect(payload?.target).toBe('/node/x');
  });
});
