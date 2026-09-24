import { describe, it, expect } from 'vitest';
import {
  resolveEffectiveBase,
  rewriteLink,
  resolveAbsolute,
  isLoopbackHost,
} from './proxy';

describe('resolveEffectiveBase', () => {
  it('passes through relative same-origin paths', () => {
    expect(resolveEffectiveBase('/api/v1')).toEqual({
      effective: '/api/v1',
      isProxied: false,
    });
  });

  it('uses loopback hosts directly (no proxy)', () => {
    expect(resolveEffectiveBase('http://localhost:8000/api/v1')).toEqual({
      effective: 'http://localhost:8000/api/v1',
      isProxied: false,
    });
    expect(resolveEffectiveBase('http://127.0.0.1:8000/api/v1').isProxied).toBe(false);
  });

  it('mounts remote hosts under /tiled/<host><path>', () => {
    expect(resolveEffectiveBase('https://tiled-demo.nsls2.bnl.gov/api/v1')).toEqual({
      effective: '/tiled/tiled-demo.nsls2.bnl.gov/api/v1',
      isProxied: true,
    });
  });

  it('preserves an explicit port in the proxied host', () => {
    expect(resolveEffectiveBase('https://host.example:8443/api/v1').effective).toBe(
      '/tiled/host.example:8443/api/v1',
    );
  });

  it('can be disabled or remounted', () => {
    expect(resolveEffectiveBase('https://h/api/v1', { proxyEnabled: false }).isProxied).toBe(false);
    expect(resolveEffectiveBase('https://h/api/v1', { proxyMount: '/proxy' }).effective).toBe(
      '/proxy/h/api/v1',
    );
  });
});

describe('isLoopbackHost', () => {
  it('detects loopback hostnames', () => {
    expect(isLoopbackHost('localhost')).toBe(true);
    expect(isLoopbackHost('127.0.0.1')).toBe(true);
    expect(isLoopbackHost('::1')).toBe(true);
    expect(isLoopbackHost('example.org')).toBe(false);
  });
});

describe('rewriteLink', () => {
  it('rewrites remote links under the proxy mount using the link host', () => {
    expect(
      rewriteLink(
        'https://tiled-demo.nsls2.bnl.gov/api/v1/search/a?x=1',
        '/tiled/tiled-demo.nsls2.bnl.gov/api/v1',
      ),
    ).toBe('/tiled/tiled-demo.nsls2.bnl.gov/api/v1/search/a?x=1');
  });

  it('falls back to a bare relative path for non-proxied bases', () => {
    expect(
      rewriteLink('http://localhost:8000/api/v1/search/a', '/api/v1'),
    ).toBe('/api/v1/search/a');
  });
});

describe('resolveAbsolute', () => {
  it('resolves a relative base against the window origin', () => {
    expect(resolveAbsolute('/api/v1')).toBe(
      `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost'}/api/v1`,
    );
  });

  it('leaves absolute bases untouched', () => {
    expect(resolveAbsolute('http://host/api/v1')).toBe('http://host/api/v1');
  });
});
