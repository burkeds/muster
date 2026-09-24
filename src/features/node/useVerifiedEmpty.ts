import { useEffect, useRef, useState } from "react";
import type { Resource, NodeAttributes, TiledClient } from "@tiled/client-core";

export interface VerifiedEmptyParams {
  /** Framework-agnostic Tiled client for the active server. */
  client: TiledClient | null;
  /** Path segments of the container currently being browsed. */
  segments: string[];
  /** Candidate container children (cached structure.count === 0) to verify. */
  candidates: Resource<NodeAttributes>[];
  /** Set false to skip probing entirely (e.g. hideEmpty off). */
  enabled: boolean;
  /** Max concurrent probes. */
  concurrency?: number;
}

/**
 * Confirm whether container children flagged as "empty" (by their cached
 * structure.count) really have no children.
 *
 * Some Tiled catalogs under-report the container `count` on registered nodes
 * while still serving their children over /search (e.g. a stale snapshot in
 * catalog.db reports count 0 but returns actual children). Rather than trust
 * the possibly-stale count, we probe each candidate's live /search listing and
 * only treat it as empty when the probe returns no children. This prevents
 * "hide empty containers" from dropping data-bearing containers.
 *
 * Returns the set of candidate ids confirmed to have zero children. Candidates
 * are kept visible until confirmed, so an obsolete count can never disappear a
 * container that actually has data.
 *
 * The effect is keyed on a stable string derived from the candidate ids (not the
 * array reference), so callers may pass a freshly-allocated array each render
 * without triggering repeated re-probing / re-render loops.
 */
export function useVerifiedEmptyContainers({
  client,
  segments,
  candidates,
  enabled,
  concurrency = 6,
}: VerifiedEmptyParams): Set<string> {
  const pathKey = segments.join("/");
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const candidatesRef = useRef(candidates);
  candidatesRef.current = candidates;
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const candidatesKey = candidates.map((c) => c.id).join("\u0000");

  useEffect(() => {
    setConfirmed(new Set());
    const current = candidatesRef.current;
    const currentSegments = segmentsRef.current;
    if (!enabled || !client || current.length === 0) return;

    const cancelledRef = { cancelled: false };
    const confirmedIds = new Set<string>();
    let nextIndex = 0;

    const run = async () => {
      while (!cancelledRef.cancelled) {
        const idx = nextIndex;
        nextIndex += 1;
        if (idx >= current.length) return;
        const res = current[idx];
        if (!res.id) continue;
        try {
          const probe = await client.search([...currentSegments, res.id], {
            pageLimit: 1,
            fields: ["structure_family"],
          });
          if (!cancelledRef.cancelled && probe.data.length === 0) {
            confirmedIds.add(res.id);
          }
        } catch {
          // Probe failed — be conservative and keep the container visible.
        }
      }
    };

    // Only publish state once all probes finish to avoid per-child re-renders.
    const workers = Array.from(
      { length: Math.min(concurrency, current.length) },
      () => run(),
    );
    void Promise.all(workers).then(() => {
      if (!cancelledRef.cancelled) setConfirmed(new Set(confirmedIds));
    });

    return () => {
      cancelledRef.cancelled = true;
    };
  }, [client, pathKey, enabled, candidatesKey, concurrency]);

  return confirmed;
}
