import { describe, expect, it } from "vitest";
import { resolveSeoMetadata } from "./seo";

describe("SEO metadata", () => {
  it("uses deliberate metadata for public routes", () => {
    expect(resolveSeoMetadata("/portfolio").title).toBe("Selected Work — Serhii Dev Studio");
    expect(resolveSeoMetadata("/services/landing-page")).toMatchObject({
      title: "Landing Page — Serhii Dev Studio",
      indexable: true,
      type: "article"
    });
  });

  it("normalizes trailing slashes", () => {
    expect(resolveSeoMetadata("/pricing/")).toEqual(resolveSeoMetadata("/pricing"));
  });

  it("prevents indexing account and unknown routes", () => {
    expect(resolveSeoMetadata("/dashboard/projects").indexable).toBe(false);
    expect(resolveSeoMetadata("/missing").indexable).toBe(false);
  });
});
