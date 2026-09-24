import { describe, it, expect } from 'vitest';
import { cleanUrl } from './TiledConfig';

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
