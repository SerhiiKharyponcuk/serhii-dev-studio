import { describe, expect, it } from "vitest";
import { calculateOrderEstimate, loginSchema, orderSchema } from "./index";

describe("authentication contracts", () => {
  it("rejects malformed credentials", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "short" }).success).toBe(false);
  });
});

describe("order contract", () => {
  it("accepts a complete project request", () => {
    expect(
      orderSchema.safeParse({
        projectType: "Business Website",
        buildApproach: "NEW_WEBSITE",
        selectedFeatures: ["cms", "advanced-seo"],
        projectName: "New business site",
        description: "A professional website for a growing consultancy.",
        requiredFeatures: "Contact form and service pages",
        budgetRange: "$1,500–$3,500",
        deadlineFlexible: true,
        firstName: "Test",
        lastName: "Client",
        email: "client@example.com",
        country: "Netherlands"
      }).success
    ).toBe(true);
  });

  it("rejects short and unsafe-shaped submissions", () => {
    expect(orderSchema.safeParse({ projectType: "Other", description: "x" }).success).toBe(false);
  });

  it("calculates estimates only from the trusted feature catalogue", () => {
    expect(calculateOrderEstimate("Business Website", ["cms", "advanced-seo"])).toBe(1760);
  });
});
