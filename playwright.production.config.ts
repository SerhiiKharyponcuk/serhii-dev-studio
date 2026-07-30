import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PRODUCTION_WEB_URL;
if (!baseURL) throw new Error("PRODUCTION_WEB_URL is required");

export default defineConfig({
  testDir: "./tests/production",
  fullyParallel: false,
  retries: 2,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [{ name: "production-chromium", use: { ...devices["Desktop Chrome"] } }]
});
