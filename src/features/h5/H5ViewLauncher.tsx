import { lazy, Suspense, useState, type ReactNode } from "react";
import { ArrowLeft, Boxes } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/common/StateMessage";

// h5web pulls in three.js & friends; only load it once the user asks for it.
const H5ExploreView = lazy(() =>
  import("./H5ExploreView").then((m) => ({ default: m.H5ExploreView })),
);

export interface H5ViewLauncherProps {
  /** Tiled segments of the HDF5 root container node. */
  segments: string[];
  /** Whether this node offers the HDF5 media type (show the button). */
  enabled: boolean;
  /** Normal (non-h5web) content shown while the explorer is closed. */
  children: ReactNode;
}

/**
 * Shows normal content by default. When the node supports HDF5 it adds a
 * "View with H5Web" button that swaps the content in place for the h5web
 * explorer (lazy-loaded). "Back to list" restores the normal content.
 */
export function H5ViewLauncher({
  segments,
  enabled,
  children,
}: H5ViewLauncherProps) {
  const [show, setShow] = useState(false);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        {show ? (
          <Button variant="ghost" size="sm" onClick={() => setShow(false)}>
            <ArrowLeft />
            Back to list
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShow(true)}>
            <Boxes />
            View with H5Web
          </Button>
        )}
      </div>
      {show ? (
        <Suspense
          fallback={
            <StateMessage kind="loading" title="Loading HDF5 explorer…" />
          }
        >
          <H5ExploreView segments={segments} />
        </Suspense>
      ) : (
        children
      )}
    </div>
  );
}
