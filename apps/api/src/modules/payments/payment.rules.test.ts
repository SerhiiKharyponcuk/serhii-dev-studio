import { describe, expect, it } from "vitest";
import { nextManualPaymentStatus } from "./payment.rules.js";

describe("manual payment workflow", () => {
  it("moves a submitted payment to confirmation", () =>
    expect(nextManualPaymentStatus("PENDING", "CLIENT_SUBMIT")).toBe("WAITING_CONFIRMATION"));
  it("allows an administrator to approve only a waiting payment", () => {
    expect(nextManualPaymentStatus("WAITING_CONFIRMATION", "ADMIN_APPROVE")).toBe("PAID");
    expect(() => nextManualPaymentStatus("PENDING", "ADMIN_APPROVE")).toThrow("not allowed");
  });
  it("prevents duplicate credit", () =>
    expect(() => nextManualPaymentStatus("PAID", "ADMIN_APPROVE")).toThrow("not allowed"));
});
