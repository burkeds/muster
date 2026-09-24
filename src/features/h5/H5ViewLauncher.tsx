import { lazy, Suspense, useState, type ReactNode } from "react";
import { ArrowLeft, Boxes } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/common/StateMessage";

// h5web pulls in three.js & friends; only load it once the user asks for it.
const H5ExploreView = lazy(() =>
  import("./H5ExploreView").then((m) => ({ default: m.H5ExploreView })),
);

const INCOMPATIBLE_TITLE =
  "Contains data that can't be shown in the HDF5 explorer (e.g. tables). Only containers of containers/arrays are currently explorable.";

export interface H5ViewLauncherProps {
  /** Tiled segments of the root container node. */
  segments: string[];
  /** Whether the node offers the HDF5 format (show the button at all). */
  available: boolean;
  /** Whether the subtree is explorable with h5web (button enabled). */
  compatible: boolean;
  /** Normal (non-h5web) content shown while the explorer is closed. */
  children: ReactNode;
}

/**
 * Shows normal content by default. When the node offers the HDF5 format it adds
 * a "View with H5Web" button that swaps the content in place for the h5web
 * explorer (lazy-loaded). "Back to list" restores the normal content.
 *
 * If `available` but the subtree is not `compatible`, the button renders
 * disabled (greyed out) with an explanatory tooltip.
 */
export function H5ViewLauncher({
  segments,
  available,
  compatible,
  children,
}: H5ViewLauncherProps) {
  const [show, setShow] = useState(false);

  if (!available) {
    return <>{children}</>;
  }

  const button = show ? (
    <Button variant="ghost" size="sm" onClick={() => setShow(false)}>
      <ArrowLeft />
      Back to list
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      disabled={!compatible}
      title={compatible ? undefined : INCOMPATIBLE_TITLE}
      onClick={() => compatible && setShow(true)}
    >
      <Boxes />
      View with H5Web
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">{button}</div>
      {show ? (
        <Suspense fallback={<StateMessage kind="loading" title="Loading HDF5 explorer…" />}>
          <H5ExploreView segments={segments} />
        </Suspense>
      ) : (
        children
      )}
    </div>
  );
}
