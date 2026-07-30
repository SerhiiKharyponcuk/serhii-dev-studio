import { expect, test } from "@playwright/test";

const apiUrl = process.env.PRODUCTION_API_URL;
const smokeEmail = process.env.SMOKE_CLIENT_EMAIL;
const smokePassword = process.env.SMOKE_CLIENT_PASSWORD;

test("frontend and API are healthy with strict CORS", async ({ page, request, baseURL }) => {
  if (!apiUrl || !baseURL) throw new Error("Production web and API URLs are required");
  const webOrigin = new URL(baseURL).origin;
  const apiOrigin = new URL(apiUrl).origin;

  const readiness = await request.get(`${apiOrigin}/api/ready`);
  expect(readiness.ok()).toBe(true);
  await expect(readiness.json()).resolves.toMatchObject({
    success: true,
    data: { status: "ready" }
  });

  const preflight = await request.fetch(`${apiOrigin}/api/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: webOrigin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type"
    }
  });
  expect(preflight.ok()).toBe(true);
  expect(preflight.headers()["access-control-allow-origin"]).toBe(webOrigin);
  expect(preflight.headers()["access-control-allow-credentials"]).toBe("true");

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Digital products");
  await expect(page.getByRole("link", { name: "Start a project" })).toBeVisible();
});

test("production client can authenticate and load the dashboard", async ({ page }) => {
  test.skip(!smokeEmail || !smokePassword, "Smoke-test client credentials are not configured");

  await page.goto("/login");
  await page.getByLabel("Email").fill(smokeEmail!);
  await page.getByLabel("Password").fill(smokePassword!);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  await expect(page.getByText("Dashboard data could not be loaded")).toHaveCount(0);
});
