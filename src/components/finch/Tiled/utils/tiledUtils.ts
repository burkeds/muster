import { TiledItemLinks } from '@blueskyproject/tiled';

/**
 * Extracts the Tiled node path from a `TiledItemLinks` object.
 * The path is the segment of the `self` URL that follows `/metadata/`.
 */
export const getPathFromLinks = (links: TiledItemLinks) => {
  const self = links?.self;
  if (!self) {
    throw new Error('No self link found in TiledItemLinks');
  }
  const url = new URL(self);
  const pathIndex = url.pathname.indexOf('/metadata/');
  if (pathIndex === -1) {
    throw new Error('No metadata segment found in self link URL');
  }
  return url.pathname.substring(pathIndex + '/metadata'.length);
};

/**
 * Returns a cleaned version of the initial path for Tiled searches.
 * Removes leading and trailing slashes and whitespace.
 */
export const cleanTiledInitialPath = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  const cleanedPath = path.trim().replace(/^\/+|\/+$/g, '');
  return cleanedPath || undefined;
};
