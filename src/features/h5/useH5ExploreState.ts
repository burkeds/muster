import type { NodeMetadata, StructureFamily } from '@/lib/tiledTypes';
import {
  containerHasHdf5Format,
  isH5CompatibleFamilies,
  supportsHdf5,
} from '@photonic/tiled-client-h5web';
import { useNodeSearch } from '@/hooks/useNodeSearch';

export interface UseH5ExploreStateParams {
  /** Tiled segments of the container in question. */
  segments: string[];
  /** The container node's own metadata. */
  metadata: NodeMetadata | undefined;
  /** The server's HDF5 export formats for the container family (About). */
  containerFormats?: string[] | undefined;
  /**
   * Direct children structure families, when the caller already has the listing
   * (e.g. the browse page). When omitted, the hook fetches them.
   */
  childrenFamilies?: (StructureFamily | string | undefined)[] | undefined;
}

/**
 * Decides whether the "View with H5Web" button should appear for a container
 * and whether it should be enabled:
 *
 * - `available`: the node is a container offering the HDF5 export format.
 * - `compatible`: the subtree can be explored — i.e. the node is genuinely HDF5
 *   backed, or its direct children are all container/array (Option C gate).
 */
export function useH5ExploreState({
  segments,
  metadata,
  containerFormats,
  childrenFamilies,
}: UseH5ExploreStateParams): { available: boolean; compatible: boolean } {
  const family = metadata?.attributes?.structure_family;
  const available = containerHasHdf5Format(family, containerFormats);

  const needsQuery =
    available && childrenFamilies === undefined && !supportsHdf5(metadata);
  const search = useNodeSearch({
    segments,
    fields: ['structure_family'],
    pageLimit: 300,
    enabled: needsQuery,
  });

  const queriedFamilies = available
    ? (search.data?.data ?? []).map((r) => r.attributes?.structure_family)
    : [];

  const families = childrenFamilies ?? queriedFamilies;
  const compatible =
    available && (supportsHdf5(metadata) || isH5CompatibleFamilies(families));

  return { available, compatible };
}
