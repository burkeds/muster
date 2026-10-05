import type {
  ArrayStructure,
  AwkwardStructure,
  ContainerStructure,
  SparseStructure,
  TableStructure,
  TiledItemLinks,
  TiledSearchItem,
  TiledStructures,
} from '@blueskyproject/tiled';

/**
 * Structure families used by the muster UI.
 * Extends the SDK union with `bytes` / `ragged` which real Tiled servers still
 * advertise but `@blueskyproject/tiled` does not model yet.
 */
export type StructureFamily =
  | 'array'
  | 'awkward'
  | 'bytes'
  | 'container'
  | 'ragged'
  | 'sparse'
  | 'table'
  | 'composite';

/** Ragged structure (not exported by the official SDK). */
export interface RaggedStructure {
  data_type?: unknown;
  shape?: Array<number | null>;
  size?: number;
  partitions?: number[];
  dims?: string[] | null;
  resizable?: boolean;
}

/** Asset entry on a data source (returned when include_data_sources=true). */
export interface TiledAsset {
  data_uri?: string;
  is_directory?: boolean;
  parameter?: string | null;
  num?: number;
  id?: string;
  size?: number;
}

/** Data source entry (SDK types data_sources as string|null; real API returns objects). */
export interface TiledDataSource {
  structure_family?: StructureFamily | string;
  structure?: unknown;
  id?: string;
  mimetype?: string;
  parameters?: Record<string, unknown>;
  assets?: TiledAsset[];
  management?: string;
}

/**
 * Node metadata as returned by `TiledApiClient.getMetadata` (a bare search item),
 * with a looser `data_sources` so callers can read assets when requested.
 */
export type NodeMetadata = TiledSearchItem<TiledStructures> & {
  attributes: TiledSearchItem<TiledStructures>['attributes'] & {
    structure_family: StructureFamily | TiledSearchItem<TiledStructures>['attributes']['structure_family'];
    data_sources?: TiledDataSource[] | string | null;
  };
};

/** Listing/search item alias (matches SDK TiledSearchItem). */
export type ListingItem = TiledSearchItem<TiledStructures>;

export type {
  ArrayStructure,
  AwkwardStructure,
  ContainerStructure,
  SparseStructure,
  TableStructure,
  TiledItemLinks,
  TiledSearchItem,
  TiledStructures,
};

/** Pagination links on a search result (SDK uses required fields; keep optional for safety). */
export interface PaginationLinks {
  self?: string;
  next?: string | null;
  prev?: string | null;
  first?: string;
  last?: string;
}
