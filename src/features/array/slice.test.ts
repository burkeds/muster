import { describe, it, expect } from 'vitest';
import {
  isValidSliceControl,
  sliceControlsInitial,
  isWholeArray,
  buildSliceString,
  firstFrameControls,
  to2D,
} from './slice';

describe('isValidSliceControl', () => {
  it('accepts indices, slices, open slices and steps', () => {
    for (const ok of ['5', ':', '1:8', ':10', '-50:', '::2', '0:10:2', '']) {
      expect(isValidSliceControl(ok)).toBe(true);
    }
  });
  it('rejects non-numeric input', () => {
    for (const bad of ['a', '1;2', '1..2', '1:2:3:4']) {
      expect(isValidSliceControl(bad)).toBe(false);
    }
  });
});

describe('sliceControlsInitial', () => {
  it('returns one empty control per dimension', () => {
    expect(sliceControlsInitial(0)).toEqual([]);
    expect(sliceControlsInitial(1)).toEqual(['']);
    expect(sliceControlsInitial(3)).toEqual(['', '', '']);
  });
});

describe('isWholeArray', () => {
  it('treats empty or colon controls as the whole array', () => {
    expect(isWholeArray(['', ''])).toBe(true);
    expect(isWholeArray([':', ':'])).toBe(true);
    expect(isWholeArray(['', '0'])).toBe(false);
    expect(isWholeArray(['1:8'])).toBe(false);
  });
});

describe('buildSliceString', () => {
  it('returns undefined for the whole array (no slice param)', () => {
    expect(buildSliceString(['', ''], 2)).toBeUndefined();
    expect(buildSliceString([':', ':'], 2)).toBeUndefined();
    expect(buildSliceString([], 0)).toBeUndefined();
  });
  it('joins per-dimension controls', () => {
    expect(buildSliceString(['0', ''], 3)).toBe('0,:,:');
    expect(buildSliceString(['1:8', '10'], 2)).toBe('1:8,10');
    expect(buildSliceString(['::2', ':', ':'], 3)).toBe('::2,:,:');
  });
});

describe('firstFrameControls', () => {
  it('scalarizes leading dims for N-D', () => {
    expect(firstFrameControls(3)).toEqual(['0', ':', ':']);
    expect(firstFrameControls(4)).toEqual(['0', '0', ':', ':']);
  });
  it('keeps whole for 1-D/2-D', () => {
    expect(firstFrameControls(1)).toEqual([':']);
    expect(firstFrameControls(2)).toEqual([':', ':']);
  });
});

describe('to2D', () => {
  it('passes through 2-D blocks', () => {
    expect(to2D([[1, 2], [3, 4]])).toEqual([[1, 2], [3, 4]]);
  });
  it('reduces 3-D to the trailing 2-D frame', () => {
    expect(to2D([[[1], [2]], [[3], [4]]])).toEqual([[1], [2]]);
  });
  it('wraps 1-D data as a single row', () => {
    expect(to2D([1, 2, 3])).toEqual([[1, 2, 3]]);
  });
});
