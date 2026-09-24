import { describe, it, expect } from 'vitest';
import {
  axisLength,
  estimateElements,
  estimateBytes,
  estimateJsonTextBytes,
  humanBytes,
  WARN_BYTES,
  DANGER_BYTES,
} from './size';

describe('axisLength', () => {
  it('whole + index forms', () => {
    expect(axisLength('', 100)).toBe(100);
    expect(axisLength(':', 100)).toBe(100);
    expect(axisLength('0', 100)).toBe(1);
    expect(axisLength('5', 100)).toBe(1);
    expect(axisLength('-1', 100)).toBe(1);
    expect(axisLength('-3', 100)).toBe(1);
  });
  it('slice forms', () => {
    expect(axisLength('5:15', 100)).toBe(10);
    expect(axisLength(':10', 100)).toBe(10);
    expect(axisLength('10:', 100)).toBe(90);
    expect(axisLength('::2', 100)).toBe(50);
    expect(axisLength('3:3', 100)).toBe(0);
    expect(axisLength('-10:', 100)).toBe(10);
  });
  it('rejects invalid controls', () => {
    expect(axisLength('abc', 100)).toBeNull();
    expect(axisLength('1:2:3:4', 100)).toBeNull();
    expect(axisLength('1::0', 100)).toBeNull();
  });
});

describe('estimateElements', () => {
  it('computes the product across dimensions', () => {
    expect(estimateElements(['0', ':', ':'], [900, 1080, 1280])).toBe(1_382_400);
    expect(estimateElements(['', '', ''], [900, 1080, 1280])).toBe(1_244_160_000);
  });
  it('returns null when any axis is invalid', () => {
    expect(estimateElements(['abc'], [10])).toBeNull();
  });
});

describe('estimateBytes / json', () => {
  it('raw bytes = elements * itemsize', () => {
    expect(estimateBytes(1_382_400, 2)).toBe(2_764_800);
  });
  it('a JSON download estimate is larger than raw', () => {
    expect(estimateJsonTextBytes(1_382_400, 2)).toBeGreaterThan(2_764_800);
  });
});

describe('humanBytes', () => {
  it('formats units', () => {
    expect(humanBytes(0)).toBe('0 B');
    expect(humanBytes(512)).toBe('512 B');
    expect(humanBytes(2_764_800)).toBe('2.64 MB');
    expect(humanBytes(2_488_320_000)).toBe('2.32 GB');
  });
});

describe('thresholds', () => {
  it('defines 100 MB and 1 GB thresholds', () => {
    expect(WARN_BYTES).toBe(100 * 1024 ** 2);
    expect(DANGER_BYTES).toBe(1024 ** 3);
  });
});
