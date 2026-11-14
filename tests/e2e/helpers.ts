import { expect, type Page } from "@playwright/test";

/** The signature croissant is seeded in every fresh database. */
const signatureSlug = "pistachio-orange-blossom-croissant";

/**
 * Adds the signature croissant through the storefront instead of writing a
 * hand-built cart to localStorage. That keeps the test tied to whatever
 * variant ids the current database actually holds.
 */
export async function addSignatureItem(page: Page) {
  await page.goto(`/en/shop/${signatureSlug}`);
  await page
    .locator(".add-row")
    .getByRole("button", { name: /^add to bag$/i })
    .click();
  await expect(page.getByText("Added to your bag")).toBeVisible();
}

/** Signs in through the dedicated admin entry and waits for the panel itself. */
export async function signInAdmin(page: Page) {
  await page.goto("/en/admin/sign-in");
  await page.locator("#admin-email").fill("admin@mazzaq.co");
  await page.locator("#admin-password").fill("MazzaqAdmin!2026");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/en\/admin$/);
}
