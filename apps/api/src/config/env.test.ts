import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnvironment = { ...process.env };
const productionEnvironment = {
  NODE_ENV: "production",
  WEB_ORIGIN: "https://www.example.com",
  CORS_ALLOWED_ORIGINS: "https://preview.example.com",
  DATABASE_URL: "postgresql://user:password@example.internal:5432/studio",
  JWT_ACCESS_SECRET: "production-access-secret-with-at-least-32-characters",
  JWT_REFRESH_SECRET: "production-refresh-secret-with-at-least-32-characters",
  SETTINGS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
  RESEND_API_KEY: "re_test",
  SMTP_FROM: "Serhii Dev Studio <hello@updates.example.com>",
  FILE_STORAGE: "s3",
  S3_BUCKET: "studio-private-files",
  S3_ACCESS_KEY_ID: "test-access-key",
  S3_SECRET_ACCESS_KEY: "test-secret-key"
};

afterEach(() => {
  process.env = { ...originalEnvironment };
  vi.resetModules();
});

describe("production environment validation", () => {
  it("accepts a complete HTTPS production configuration", async () => {
    process.env = { ...originalEnvironment, ...productionEnvironment };
    const { allowedWebOrigins, env } = await import("./env.js");

    expect(env.FILE_STORAGE).toBe("s3");
    expect(allowedWebOrigins).toEqual(
      new Set(["https://www.example.com", "https://preview.example.com"])
    );
  });

  it("rejects insecure web origins", async () => {
    process.env = {
      ...originalEnvironment,
      ...productionEnvironment,
      WEB_ORIGIN: "http://www.example.com"
    };

    await expect(import("./env.js")).rejects.toThrow("Production web origins must use HTTPS");
  });

  it("rejects local file storage in production", async () => {
    process.env = {
      ...originalEnvironment,
      ...productionEnvironment,
      FILE_STORAGE: "local"
    };

    await expect(import("./env.js")).rejects.toThrow(
      "Production requires S3-compatible file storage"
    );
  });

  it("rejects disabled admin second-factor verification in production", async () => {
    process.env = {
      ...originalEnvironment,
      ...productionEnvironment,
      ADMIN_EMAIL_2FA: "false"
    };

    await expect(import("./env.js")).rejects.toThrow(
      "Production requires email second-factor verification"
    );
  });
});
