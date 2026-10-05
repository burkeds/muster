import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseJwtPayload,
  isTokenExpired,
  tokenManager,
  scopeTokens,
  scopeForServer,
  syncSdkTokenStore,
} from './token-manager';

function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none' })).replace(/=+$/, '');
  const body = btoa(JSON.stringify(payload)).replace(/=+$/, '');
  return `${header}.${body}.sig`;
}

describe('scopeTokens', () => {
  beforeEach(() => {
    localStorage.clear();
    scopeTokens('default');
  });

  it('isolates saved tokens between server scopes', () => {
    scopeTokens(scopeForServer('http://a:8000/api/v1'));
    tokenManager.saveTokens('tok-a', 'ref-a');
    expect(tokenManager.getAccessToken()).toBe('tok-a');

    scopeTokens(scopeForServer('http://b:9000/api/v1'));
    expect(tokenManager.getAccessToken()).toBeNull();
    tokenManager.saveTokens('tok-b', 'ref-b');

    scopeTokens(scopeForServer('http://a:8000/api/v1'));
    expect(tokenManager.getAccessToken()).toBe('tok-a');
  });
});

describe('syncSdkTokenStore', () => {
  beforeEach(() => localStorage.clear());

  it('mirrors active tokens into the SDK global keys', () => {
    syncSdkTokenStore('access', 'refresh');
    expect(localStorage.getItem('tiledAccessToken')).toBe('access');
    expect(localStorage.getItem('tiledRefreshToken')).toBe('refresh');
  });

  it('clears SDK global keys when tokens are null', () => {
    syncSdkTokenStore('access', 'refresh');
    syncSdkTokenStore(null, null);
    expect(localStorage.getItem('tiledAccessToken')).toBeNull();
    expect(localStorage.getItem('tiledRefreshToken')).toBeNull();
  });

  it('saveTokens/clear also keep the SDK store in sync', () => {
    scopeTokens('default');
    tokenManager.saveTokens('a', 'r');
    expect(localStorage.getItem('tiledAccessToken')).toBe('a');
    expect(localStorage.getItem('tiledRefreshToken')).toBe('r');
    tokenManager.clear();
    expect(localStorage.getItem('tiledAccessToken')).toBeNull();
    expect(localStorage.getItem('tiledRefreshToken')).toBeNull();
  });
});

describe('parseJwtPayload', () => {
  it('decodes the payload of a JWT', () => {
    const token = makeToken({ sub: 'alice', exp: 9999999999 });
    expect(parseJwtPayload(token)).toMatchObject({ sub: 'alice' });
  });
});

describe('isTokenExpired', () => {
  it('returns false for a future expiry', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for a past expiry', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(isTokenExpired(token)).toBe(true);
  });
});

describe('tokenManager', () => {
  beforeEach(() => {
    localStorage.clear();
    scopeTokens('default');
    tokenManager.clear();
  });

  it('round-trips tokens and identity via localStorage', () => {
    tokenManager.saveTokens('access', 'refresh');
    tokenManager.saveIdentity({ id: 'alice' });
    expect(tokenManager.getAccessToken()).toBe('access');
    expect(tokenManager.getRefreshToken()).toBe('refresh');
    expect(tokenManager.getIdentity()).toEqual({ id: 'alice' });
  });

  it('clears everything', () => {
    tokenManager.saveTokens('access', 'refresh');
    tokenManager.clear();
    expect(tokenManager.getAccessToken()).toBeNull();
    expect(tokenManager.getRefreshToken()).toBeNull();
  });
});
