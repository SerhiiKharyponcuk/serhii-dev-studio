import { describe, expect, it } from "vitest";
import { projects, services } from "./site";

describe("editable public data", () => {
  it("keeps slugs unique and prices configurable", () => {
    expect(new Set(services.map((item) => item.slug)).size).toBe(services.length);
    expect(services.every((item) => item.price > 0)).toBe(true);
    expect(new Set(projects.map((item) => item.slug)).size).toBe(projects.length);
  });
});
