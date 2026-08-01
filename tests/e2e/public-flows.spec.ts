import { expect, test } from "@playwright/test";

test("home page exposes primary conversion paths", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Digital products");
  await expect(page.getByRole("link", { name: "Start a project" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View portfolio" })).toBeVisible();
});

const localeExpectations = [
  ["en", "Language", "Project configurator"],
  ["uk", "Мова", "Конфігуратор проєкту"],
  ["de", "Sprache", "Projektkonfigurator"],
  ["nl", "Taal", "Projectconfigurator"],
  ["ru", "Язык", "Конфигуратор проекта"],
  ["es", "Idioma", "Configurador de proyecto"],
  ["fr", "Langue", "Configurateur de projet"],
  ["pl", "Język", "Konfigurator projektu"],
  ["it", "Lingua", "Configuratore del progetto"],
  ["pt", "Idioma", "Configurador de projeto"]
] as const;

for (const [locale, languageLabel, configuratorLabel] of localeExpectations) {
  test(`locale ${locale} covers the primary journey without overflow`, async ({ page }) => {
    await page.goto(`/order?lang=${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByText(configuratorLabel, { exact: true })).toBeVisible();
    await expect(page.getByLabel(languageLabel).first()).toHaveValue(locale);
    await expect(page.locator("select").first().locator("option")).toHaveCount(10);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
}

test("portfolio filters projects", async ({ page }) => {
  await page.goto("/portfolio");
  await page.getByRole("button", { name: "E-commerce" }).click();
  await expect(page.getByRole("heading", { name: "Metro Shop" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Waves Arcade" })).toHaveCount(0);
});

test("order wizard validates required project information", async ({ page }) => {
  await page.goto("/order");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("group", { name: "Select website features" })).toBeVisible();
  const contentManagement = page.getByRole("checkbox", { name: /Content management/ });
  await page.getByText("Content management", { exact: true }).click();
  await expect(contentManagement).toBeChecked();
  await expect(page.getByText("From $920", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Tell me about the project" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Please add at least 20 characters.")).toBeVisible();
});

test("a service page preselects the matching project type", async ({ page }) => {
  await page.goto("/order?service=online-shop");
  await expect(page.getByRole("radio", { name: "Online Shop" })).toBeChecked();
});

test("contact form gives persistent success feedback", async ({ page }) => {
  await page.route("**/api/contact", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "Message received", data: null })
    });
  });
  await page.goto("/contact");
  await page.getByRole("textbox", { name: "Name" }).fill("Test Client");
  await page.getByRole("textbox", { name: "Email" }).fill("client@example.test");
  await page.getByRole("textbox", { name: "Subject" }).fill("New website");
  await page
    .getByRole("textbox", { name: "Message" })
    .fill("I would like to discuss a new business website for my company.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toHaveText("Thanks — your message has been received.");
});

test("mobile navigation opens and exposes primary pages", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
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

test("a pending client can request a new verification link", async ({ page }) => {
  await page.route("**/api/auth/resend", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "If the account is awaiting verification, a new link will be sent",
        data: null
      })
    });
  });
  await page.goto("/resend-verification");
  await page.getByRole("textbox", { name: "Email" }).fill("pending@example.test");
  await page.getByRole("button", { name: "Send verification link" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "If the account is awaiting verification, a new link was sent."
  );
});

test("admin password login requires the email second factor", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { requiresAdminVerification: true }
      })
    });
  });
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill("admin@example.test");
  await page.getByLabel("Password").fill("Admin-password-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Check your email to confirm this admin sign-in."
  );
});

test("one-time admin email link creates the protected session", async ({ page }) => {
  await page.route("**/api/auth/admin-verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { role: "ADMIN" } })
    });
  });
  await page.goto(`/admin/verify?token=${"a".repeat(48)}`);
  await expect(page.getByRole("heading", { name: "Admin sign-in confirmed" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open admin panel" })).toBeVisible();
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

test("support role cannot open the owner admin panel", async ({ page }) => {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "support-test",
          name: "Support User",
          email: "support@example.test",
          role: "SUPPORT"
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
  const workspaceToggle = page.getByRole("button", { name: "Open workspace navigation" });
  if (await workspaceToggle.isVisible()) await workspaceToggle.click();
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

test("mobile workspace navigation stays compact and accessible", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
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
          activeProjects: 0,
          unreadMessages: 0,
          openInvoices: 0,
          recentFiles: 0,
          recentUpdates: []
        }
      })
    });
  });
  await page.goto("/dashboard");
  const toggle = page.getByRole("button", { name: "Open workspace navigation" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.getByRole("link", { name: "My Projects" })).toBeVisible();
});
