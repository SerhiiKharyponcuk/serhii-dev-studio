import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Resend mail provider", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test";
    process.env.JWT_ACCESS_SECRET = "test-access-secret-with-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-at-least-32-characters";
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.SMTP_FROM = "Serhii Dev Studio <hello@example.test>";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
  });

  it("uses the HTTPS API when a Resend key is configured", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", request);
    const module = await import("./mailer.js");

    await expect(
      module.sendAccountEmail("client@example.test", "Project update", "Your project was updated.")
    ).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-resend-key",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Serhii Dev Studio <hello@example.test>",
        to: ["client@example.test"],
        subject: "Project update",
        text: "Your project was updated."
      })
    });
  });
});
