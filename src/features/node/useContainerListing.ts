import { useEffect, useState } from 'react';
import { useNodeSearch } from '@/hooks/useNodeSearch';
import type { Resource, NodeAttributes } from '@tiled/client-core';
import { isContainerEmpty } from './utils';

/** Server-side max page size Tiled accepts per request. */
export const MAX_FETCH_LIMIT = 300;

/**
 * Listing of a container's children with an optional "hide empty containers"
 * mode. When enabled we fetch up to `MAX_FETCH_LIMIT` children in one request,
 * drop empty containers client-side, then paginate the filtered set locally.
 * Otherwise the server paginates normally.
 */
export function useContainerListing(params: {
  segments: string[];
  pageSize?: number;
  hideEmpty?: boolean;
}) {
  const { segments, pageSize = 60, hideEmpty = false } = params;
  const [offset, setOffset] = useState(0);
  const pathKey = segments.join('/');

  // Always begin at the top when the path or the filter changes.
  useEffect(() => {
    setOffset(0);
  }, [pathKey, hideEmpty]);

  const query = useNodeSearch({
    segments,
    pageOffset: hideEmpty ? 0 : offset,
    pageLimit: hideEmpty ? MAX_FETCH_LIMIT : pageSize,
    fields: ['structure_family', 'structure', 'metadata'],
  });

  const all = query.data?.data ?? [];
  const visible = hideEmpty ? all.filter((r) => !isContainerEmpty(r)) : all;

  const total = hideEmpty ? visible.length : (query.data?.meta?.count ?? all.length);

  const hiddenCount = hideEmpty ? all.length - visible.length : 0;
  const resources = hideEmpty ? visible.slice(offset, offset + pageSize) : visible;

  return {
    resources,
    total,
    hiddenCount,
    offset,
    setOffset,
    query,
  };
}

export type ContainerListing = ReturnType<typeof useContainerListing>;
export type ListingResource = Resource<NodeAttributes>;
