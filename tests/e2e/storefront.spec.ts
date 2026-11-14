import { expect, test } from "@playwright/test";
import { addSignatureItem, signInAdmin } from "./helpers";

test("a guest can place a cash-on-delivery order", async ({ page }) => {
  await addSignatureItem(page);

  await page.goto("/en/checkout");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const form = page.locator("form.checkout-page");
  await form.getByLabel("Full name").fill("Nour Hassan");
  await form.getByLabel("Phone number").fill("01001234567");
  await form.getByLabel("Email address").fill("nour@example.com");
  await form.getByLabel("Street and building").fill("22 Rue 7");
  await form.getByLabel("Area").fill("Maadi");
  await form.getByLabel("City").fill("Cairo");

  // Delivery is scheduled by the atelier after the order is placed.
  await page.getByRole("button", { name: /^place order$/i }).click();

  await expect(page).toHaveURL(/\/en\/order\/MZQ-\d{6}-[A-Z0-9]{5}$/);
  await expect(
    page.getByRole("heading", { name: /can’t wait for you to taste it/i }),
  ).toBeVisible();
  await expect(page.getByText(/Thank you, Nour/)).toBeVisible();
  await expect(page.getByText("Confirmed").first()).toBeVisible();
  await expect(page.getByText("Cash on delivery").first()).toBeVisible();
});

test("the cart drawer and cart page reflect the stored cart", async ({
  page,
}) => {
  await addSignatureItem(page);

  await page.goto("/en/cart");
  await expect(page.locator(".cart-line")).toHaveCount(1);
  await expect(page.locator(".cart-line")).toContainText(
    "Pistachio & orange blossom croissant",
  );
});

test("Arabic pages render right-to-left with Arabic copy", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("link", { name: /مزاق/ }).first()).toBeVisible();
});

test("signed-out visitors are redirected away from account and admin", async ({
  page,
}) => {
  await page.goto("/en/account");
  await page.waitForURL(/\/en\/sign-in/, { timeout: 15_000 });

  await page.goto("/en/admin");
  await page.waitForURL(/\/en\/admin\/sign-in/, { timeout: 15_000 });
});

test("an admin can sign in and reach the back office", async ({ page }) => {
  await signInAdmin(page);

  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/admin/);
  await expect(
    page.getByRole("heading", { name: /good morning/i }).first(),
  ).toBeVisible();
  await expect(page.locator(".admin-sidebar")).toBeVisible();
});

test("the admin order list shows the orders that were placed", async ({
  page,
}) => {
  await signInAdmin(page);

  await page.goto("/en/admin/orders");
  await expect(page.locator("table")).toBeVisible();
  await expect(page.locator("tbody tr").first()).toBeVisible();
});

test("signed-in visitors get a My orders shortcut in the header", async ({
  page,
}) => {
  await page.goto("/en");
  await expect(page.getByRole("link", { name: /^my orders$/i })).toHaveCount(0);

  await signInAdmin(page);
  await page.goto("/en");

  const link = page.getByRole("link", { name: /^my orders$/i });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/en\/account\/orders$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
