import { describe, expect, it } from "vitest";
import { isContainerEmpty } from "./utils";

describe("isContainerEmpty", () => {
  it("returns false for non-container families", () => {
    expect(
      isContainerEmpty({ attributes: { structure_family: "array" } }),
    ).toBe(false);
    expect(
      isContainerEmpty({ attributes: { structure_family: "table" } }),
    ).toBe(false);
    expect(
      isContainerEmpty({ attributes: { structure_family: "bytes" } }),
    ).toBe(false);
    expect(isContainerEmpty({ attributes: {} })).toBe(false);
  });

  it("returns true only for an explicit count of zero", () => {
    const r = {
      attributes: { structure_family: "container", structure: { count: 0 } },
    };
    expect(isContainerEmpty(r)).toBe(true);
  });

  it("treats a positive count as non-empty", () => {
    const r = {
      attributes: { structure_family: "container", structure: { count: 5 } },
    };
    expect(isContainerEmpty(r)).toBe(false);
  });

  it("treats a missing count as unknown (non-empty), never hiding without server confirmation", () => {
    expect(
      isContainerEmpty({ attributes: { structure_family: "container" } }),
    ).toBe(false);
    expect(
      isContainerEmpty({
        attributes: { structure_family: "container", structure: {} },
      }),
    ).toBe(false);
    expect(
      isContainerEmpty({
        attributes: {
          structure_family: "container",
          structure: { contents: null },
        },
      }),
    ).toBe(false);
  });
});
