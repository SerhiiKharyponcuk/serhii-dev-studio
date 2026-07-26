import { expect, test } from "@playwright/test";

test("home page exposes primary conversion paths", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Digital products");
  await expect(page.getByRole("link", { name: "Start a project" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View portfolio" })).toBeVisible();
});

test("portfolio filters projects", async ({ page }) => {
  await page.goto("/portfolio");
  await page.getByRole("button", { name: "E-commerce" }).click();
  await expect(page.getByRole("heading", { name: "Metro Shop" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Waves Arcade" })).toHaveCount(0);
});

test("order wizard validates required project information", async ({ page }) => {
  await page.goto("/order");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "2. Project information" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("String must contain at least 20 character(s)")).toBeVisible();
});

test("mobile navigation opens and exposes primary pages", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  const navigation = page.getByRole("banner").getByRole("navigation");
  await expect(navigation.getByRole("link", { name: "Services", exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Start project", exact: true })).toBeVisible();
});

test("private dashboard redirects an anonymous visitor", async ({ page }) => {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ success: false, message: "Authentication required" })
    });
  });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("client role cannot open the admin panel", async ({ page }) => {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "client-test",
          name: "Test Client",
          email: "client@example.com",
          role: "CLIENT"
        }
      })
    });
  });
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("administrator can open payment and invoice operations", async ({ page }) => {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "admin-test",
          name: "Test Admin",
          email: "admin@example.test",
          role: "ADMIN"
        }
      })
    });
  });
  await page.route("**/api/admin/dashboard", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          clients: 1,
          newOrders: 1,
          activeProjects: 1,
          pendingPayments: { _count: 1, _sum: { amount: 10000 } }
        }
      })
    });
  });
  await page.route("**/api/client/projects", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: "project-test",
            name: "Test project",
            description: "Project fixture",
            status: "DEVELOPMENT",
            progress: 50,
            currency: "USD",
            budget: 20000,
            paid: 10000,
            deadline: null,
            stages: []
          }
        ]
      })
    });
  });
  await page.route("**/api/client/payments", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] })
    });
  });
  await page.route("**/api/client/invoices", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] })
    });
  });

  await page.goto("/admin/payments");
  await expect(page.getByRole("heading", { name: "Create payment request" })).toBeVisible();
  await page.getByRole("link", { name: "Invoices", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create invoice" })).toBeVisible();
});

test("client overview displays server-provided counts", async ({ page }) => {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "client-test",
          name: "Test Client",
          email: "client@example.test",
          role: "CLIENT"
        }
      })
    });
  });
  await page.route("**/api/client/overview", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          activeProjects: 2,
          unreadMessages: 3,
          openInvoices: 1,
          recentFiles: 4,
          recentUpdates: []
        }
      })
    });
  });
  await page.goto("/dashboard");
  await expect(page.getByText("Active projects").locator("..").getByText("2")).toBeVisible();
  await expect(page.getByText("Unread messages").locator("..").getByText("3")).toBeVisible();
});
