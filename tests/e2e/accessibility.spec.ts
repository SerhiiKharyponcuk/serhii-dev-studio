import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const route of ["/", "/portfolio", "/services", "/pricing", "/order", "/login"]) {
  test(`accessibility scan ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? "")
    );
    expect(serious, serious.map((item) => `${item.id}: ${item.help}`).join("\n")).toEqual([]);
  });
}
