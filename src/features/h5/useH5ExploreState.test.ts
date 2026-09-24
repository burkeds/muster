import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { NodeResponse } from '@tiled/client-core';

const mockUseNodeSearch = vi.fn();
vi.mock('@/hooks/useNodeSearch', () => ({
  useNodeSearch: (...args: unknown[]) => mockUseNodeSearch(...args),
}));

import { useH5ExploreState } from './useH5ExploreState';

function node(attributes: Record<string, unknown>, id = 'c'): NodeResponse {
  return {
    data: { id, attributes: attributes as never, links: {}, meta: null },
    error: null,
    links: null,
    meta: {},
  };
}

const H5 = 'application/x-hdf5';

describe('useH5ExploreState', () => {
  it('is unavailable for non-container families', () => {
    mockUseNodeSearch.mockReturnValue({ data: undefined });
    const { result } = renderHook(() =>
      useH5ExploreState({
        segments: ['a'],
        metadata: node({ structure_family: 'array' }),
      }),
    );
    expect(result.current).toEqual({ available: false, compatible: false });
    expect(mockUseNodeSearch).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it('is available + compatible for a container whose children are arrays', () => {
    mockUseNodeSearch.mockReturnValue({ data: undefined });
    const { result } = renderHook(() =>
      useH5ExploreState({
        segments: ['examples', 'images'],
        metadata: node({ structure_family: 'container' }),
        containerFormats: [H5, 'application/json'],
        childrenFamilies: ['array', 'array', 'container'],
      }),
    );
    expect(result.current.compatible).toBe(true);
    expect(mockUseNodeSearch).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('is greyed out (unavailable) when the subtree contains a table', () => {
    mockUseNodeSearch.mockReturnValue({ data: undefined });
    const { result } = renderHook(() =>
      useH5ExploreState({
        segments: ['c'],
        metadata: node({ structure_family: 'container' }),
        childrenFamilies: ['array', 'table'],
      }),
    );
    expect(result.current.available).toBe(true);
    expect(result.current.compatible).toBe(false);
  });

  it('stays compatible for genuinely HDF5-backed containers even with a table child', () => {
    mockUseNodeSearch.mockReturnValue({ data: undefined });
    const { result } = renderHook(() =>
      useH5ExploreState({
        segments: ['c'],
        metadata: node({
          structure_family: 'container',
          data_sources: [{ mimetype: H5 }],
        }),
        childrenFamilies: ['table'],
      }),
    );
    expect(result.current.compatible).toBe(true);
  });

  it('fetches children families when not provided', () => {
    mockUseNodeSearch.mockReturnValue({
      data: { data: [{ attributes: { structure_family: 'array' } }] },
    });
    const { result } = renderHook(() =>
      useH5ExploreState({
        segments: ['c'],
        metadata: node({ structure_family: 'container' }),
      }),
    );
    expect(result.current.available).toBe(true);
    expect(result.current.compatible).toBe(true);
    expect(mockUseNodeSearch).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, fields: ['structure_family'], pageLimit: 300 }),
    );
  });
});
