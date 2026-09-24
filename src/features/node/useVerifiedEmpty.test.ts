import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { Resource, NodeAttributes, TiledClient } from "@tiled/client-core";
import { useVerifiedEmptyContainers } from "./useVerifiedEmpty";

function resource(id: string): Resource<NodeAttributes> {
  return {
    id,
    attributes: { ancestors: ["root"], structure_family: "container" },
    links: {},
    meta: null,
  };
}

describe("useVerifiedEmptyContainers", () => {
  it("confirms a candidate empty only when the live probe returns no children", async () => {
    const search = vi.fn(async (segments: string[]) => {
      const id = segments[segments.length - 1];
      if (id === "a") {
        // Stale count: server reports 0 but still serves a child -> NOT empty.
        return { data: [{ id: "child" }], links: {}, meta: { count: 1 } };
      }
      return { data: [], links: {}, meta: { count: 0 } };
    });
    const client = { search } as unknown as TiledClient;

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
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenCalledWith(["root", "b"], {
      pageLimit: 1,
      fields: ["structure_family"],
    });
  });

  it("keeps candidates visible when disabled and makes no requests", () => {
    const search = vi.fn();
    const client = { search } as unknown as TiledClient;

    const { result } = renderHook(() =>
      useVerifiedEmptyContainers({
        client,
        segments: [],
        candidates: [resource("a")],
        enabled: false,
      }),
    );

    expect(result.current.size).toBe(0);
    expect(search).not.toHaveBeenCalled();
  });

  it("keeps a candidate visible when its probe fails", async () => {
    const search = vi.fn().mockRejectedValue(new Error("boom"));
    const client = { search } as unknown as TiledClient;

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
