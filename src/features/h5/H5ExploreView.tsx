import { H5Explorer } from "@tiled/client-h5web";
import { useOptionalTiledClient } from "@/config/useTiledClient";

export interface H5ExploreViewProps {
  /** Tiled segments of the HDF5 root container node (the whole-file node). */
  segments: string[];
}

/**
 * App adapter for the h5web explorer: supplies the active configured Tiled
 * client to the framework-agnostic `H5Explorer` from @tiled/client-h5web.
 */
export function H5ExploreView({ segments }: H5ExploreViewProps) {
  const client = useOptionalTiledClient();
  if (!client) return null;

  return (
    <H5Explorer
      client={client}
      segments={segments}
      className="h-[70vh] overflow-hidden rounded-md border bg-background"
    />
  );
}
