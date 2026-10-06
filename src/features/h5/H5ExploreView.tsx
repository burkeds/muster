import { H5Explorer } from "@photonic/tiled-client-h5web-react";
import { useOptionalTiledClient } from "@/config/useTiledClient";
import "./h5web-theme.css";

export interface H5ExploreViewProps {
  /** Tiled segments of the HDF5 root container node (the whole-file node). */
  segments: string[];
}

/**
 * App adapter for the h5web explorer: supplies the active configured Tiled
 * client to the React `H5Explorer` from @photonic/tiled-client-h5web-react.
 */
export function H5ExploreView({ segments }: H5ExploreViewProps) {
  const client = useOptionalTiledClient();
  if (!client) return null;

  return (
    <H5Explorer
      client={client}
      segments={segments}
      className="h5web-themed h-[70vh] overflow-hidden rounded-md border bg-background"
    />
  );
}
