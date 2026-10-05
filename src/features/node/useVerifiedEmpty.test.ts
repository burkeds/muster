import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { TiledApiClient } from "@blueskyproject/tiled";
import type { ListingItem } from "@/lib/tiledTypes";
import { useVerifiedEmptyContainers } from "./useVerifiedEmpty";

function resource(id: string): ListingItem {
  return {
    id,
    attributes: {
      ancestors: ["root"],
      structure_family: "container",
      specs: [],
      metadata: {},
      structure: { contents: null, count: 0 },
      sorting: null,
      data_sources: null,
    },
    links: { self: "" },
    meta: null,
  };
}

describe("useVerifiedEmptyContainers", () => {
  it("confirms a candidate empty only when the live probe returns no children", async () => {
    const getSearch = vi.fn(async (path: string) => {
      const id = path.split("/").pop();
      if (id === "a") {
        // Stale count: server reports 0 but still serves a child -> NOT empty.
        return { data: [{ id: "child" }], links: {}, meta: { count: 1 }, error: null };
      }
      return { data: [], links: {}, meta: { count: 0 }, error: null };
    });
    const client = { getSearch } as unknown as TiledApiClient;

    const { result } = renderHook(() =>
      useVerifiedEmptyContainers({
        client,
        segments: ["root"],
        candidates: [resource("a"), resource("b")],
        enabled: true,
      }),
    );

    await waitFor(() => expect(result.current.has("b")).toBe(true));
    expect(result.current.has("a")).toBe(false);
    expect(getSearch).toHaveBeenCalledTimes(2);
    expect(getSearch).toHaveBeenCalledWith(
      "root/b",
      {
        searchOptions: {
          pageLimit: 1,
          fields: ["structure_family"],
        },
      },
      { pathMode: "absolute" },
    );
  });

  it("keeps candidates visible when disabled and makes no requests", () => {
    const getSearch = vi.fn();
    const client = { getSearch } as unknown as TiledApiClient;

    const { result } = renderHook(() =>
      useVerifiedEmptyContainers({
        client,
        segments: [],
        candidates: [resource("a")],
        enabled: false,
      }),
    );

    expect(result.current.size).toBe(0);
    expect(getSearch).not.toHaveBeenCalled();
  });

  it("keeps a candidate visible when its probe fails", async () => {
    const getSearch = vi.fn().mockRejectedValue(new Error("boom"));
    const client = { getSearch } as unknown as TiledApiClient;

    const { result } = renderHook(() =>
      useVerifiedEmptyContainers({
        client,
        segments: [],
        candidates: [resource("a")],
        enabled: true,
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(result.current.size).toBe(0);
  });
});
