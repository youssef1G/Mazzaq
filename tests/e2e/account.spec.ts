import { expect, test } from "@playwright/test";
import { addSignatureItem, signInAdmin } from "./helpers";

test("a signed-in customer can manage their delivery addresses", async ({
  page,
}) => {
  await signInAdmin(page);

  await page.goto("/en/account/addresses");
  await expect(page.locator(".account-head")).toBeVisible();

  const label = `Studio ${Date.now().toString().slice(-5)}`;
  const addPanel = page.locator("details.account-add");
  if (
    !(await addPanel.evaluate(
      (element) => (element as HTMLDetailsElement).open,
    ))
  ) {
    await addPanel.locator("summary").click();
  }

  await page.locator("#new-address-label").fill(label);
  await page.locator("#new-address-recipient").fill("Mazzaq Admin");
  await page.locator("#new-address-phone").fill("01001234567");
  await page.locator("#new-address-line1").fill("14 Street 9");
  await page.locator("#new-address-city").fill("Cairo");
  await page.locator("#new-address-area").fill("Maadi");
  await page.getByRole("button", { name: /^save address$/i }).click();

  await expect(page).toHaveURL(/\/en\/account\/addresses/);
  await expect(page.getByText(label).first()).toBeVisible();
});

test("a customer can update their profile", async ({ page }) => {
  await signInAdmin(page);

  await page.goto("/en/account/profile");
  const nameField = page.locator("#name");
  await expect(nameField).toHaveValue("Mazzaق Admin");

  await page.locator("#phone").fill("01099887766");
  await page.getByRole("button", { name: /^save details$/i }).click();

  await expect(page).toHaveURL(/\/en\/account\/profile\?saved=1/);
});

test("a customer can see their order history", async ({ page }) => {
  await signInAdmin(page);

  // Place an order while signed in so it belongs to this account.
  await addSignatureItem(page);
  await page.goto("/en/checkout");

  const form = page.locator("form.checkout-page");
  await form.getByLabel("Full name").fill("Mazzaq Admin");
  await form.getByLabel("Phone number").fill("01001234567");
  await form.getByLabel("Email address").fill("admin@mazzaq.co");
  await form.getByLabel("Street and building").fill("14 Street 9");
  await form.getByLabel("Area").fill("Maadi");
  await form.getByLabel("City").fill("Cairo");

  await page.getByRole("button", { name: /^place order$/i }).click();

  await expect(page).toHaveURL(/\/en\/order\/MZQ-\d{6}-[A-Z0-9]{5}$/, {
    timeout: 20_000,
  });
  const orderNumber = page.url().split("/").pop() ?? "";

  await page.goto("/en/account/orders");
  await expect(page.locator(".account-head")).toBeVisible();
  await expect(page.locator(".card").first()).toBeVisible();
  await expect(page.getByText(orderNumber)).toBeVisible();
});

test("the contact form accepts a message", async ({ page }) => {
  await page.goto("/en/contact");
  await page.locator("#contact-name").fill("Sara Adel");
  await page.locator("#contact-email").fill("sara@example.com");
  await page.locator("#contact-subject").fill("Custom order");
  await page
    .locator("#contact-message")
    .fill("I would like to order a celebration box for twelve guests.");
  await page.getByRole("button", { name: /^send message$/i }).click();

  await expect(page.locator(".form-success")).toBeVisible();
});
