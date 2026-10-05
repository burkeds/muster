import { useEffect, useMemo, useState } from "react";
import { useNodeSearch } from "@/hooks/useNodeSearch";
import type { TiledSearchFilters } from "@blueskyproject/tiled";
import { useOptionalTiledClient } from "@/config/useTiledClient";
import type { ListingItem } from "@/lib/tiledTypes";
import { isContainerEmpty } from "./utils";
import { useVerifiedEmptyContainers } from "./useVerifiedEmpty";

/** Server-side max page size Tiled accepts per request. */
export const MAX_FETCH_LIMIT = 300;

/**
 * Listing of a container's children with an optional "hide empty containers"
 * mode and an optional server-side search `filter` (scoped to this container).
 * When hiding empties we fetch up to `MAX_FETCH_LIMIT` children in one request,
 * drop empty containers client-side, then paginate the filtered set locally.
 * Otherwise the server paginates normally.
 *
 * Empty detection is verified against the live /search endpoint (see
 * `useVerifiedEmptyContainers`) rather than trusting the cached
 * `structure.count`, so a container whose count a server under-reports is never
 * hidden while it still serves children.
 */
export function useContainerListing(params: {
  segments: string[];
  pageSize?: number;
  hideEmpty?: boolean;
  /** Tiled search filter scoped to this container (AND-combined). */
  filter?: TiledSearchFilters;
}) {
  const { segments, pageSize = 60, hideEmpty = false, filter } = params;
  const client = useOptionalTiledClient();
  const [offset, setOffset] = useState(0);
  const pathKey = segments.join("/");

  // Always begin at the top when the path, the filter or the mode changes.
  useEffect(() => {
    setOffset(0);
  }, [pathKey, hideEmpty, filter]);

  const query = useNodeSearch({
    segments,
    pageOffset: hideEmpty ? 0 : offset,
    pageLimit: hideEmpty ? MAX_FETCH_LIMIT : pageSize,
    fields: ["structure_family", "structure", "metadata"],
    filter,
  });

  const all = useMemo(() => query.data?.data ?? [], [query.data]);

  // Containers whose cached count is 0 — verify these against the live search
  // before hiding, in case the server under-reports the count.
  const candidates = useMemo(
    () => (hideEmpty ? all.filter(isContainerEmpty) : []),
    [all, hideEmpty],
  );
  const confirmedEmpty = useVerifiedEmptyContainers({
    client,
    segments,
    candidates,
    enabled: hideEmpty,
  });

  // Keep a flagged-empty container visible until the live probe confirms it.
  const visible = hideEmpty
    ? all.filter((r) => !isContainerEmpty(r) || !confirmedEmpty.has(r.id))
    : all;

  const total = hideEmpty
    ? visible.length
    : Math.max(query.data?.meta?.count ?? 0, all.length);

  const hiddenCount = hideEmpty ? all.length - visible.length : 0;
  const resources = hideEmpty
    ? visible.slice(offset, offset + pageSize)
    : visible;

  return {
    resources,
    total,
    hiddenCount,
    offset,
    setOffset,
    filter,
    hasFilter: !!filter && Object.keys(filter).length > 0,
    query,
  };
}

export type ContainerListing = ReturnType<typeof useContainerListing>;
export type ListingResource = ListingItem;
