import { expect, test } from "@playwright/test";
import { addSignatureItem, signInAdmin } from "./helpers";

test("a guest can place an InstaPay order and upload the receipt later", async ({
  page,
}) => {
  await addSignatureItem(page);

  await page.goto("/en/checkout");
  const form = page.locator("form.checkout-page");

  await form.getByLabel("Full name").fill("Omar Farouk");
  await form.getByLabel("Phone number").fill("01099887766");
  await form.getByLabel("Email address").fill("omar@example.com");
  await form.getByLabel("Street and building").fill("9 Pyramids Road");
  await form.getByLabel("Area").fill("Zamalek");
  await form.getByLabel("City").fill("Cairo");

  await form.getByText("InstaPay", { exact: true }).click();

  // InstaPay is a pay-later method: no reference and no receipt at checkout.
  await expect(form.getByLabel("Transfer reference")).toHaveCount(0);
  await expect(form.getByLabel("Payment receipt")).toHaveCount(0);

  await page.getByRole("button", { name: /^place order$/i }).click();

  await expect(page).toHaveURL(/\/en\/order\/MZQ-\d{6}-[A-Z0-9]{5}$/);
  await expect(
    page.getByRole("heading", { name: /can’t wait for you to taste it/i }),
  ).toBeVisible();
  await expect(page.getByText("InstaPay").first()).toBeVisible();

  // The order page accepts the receipt whenever the customer is ready.
  const receiptInput = page.locator('input[type="file"]');
  await receiptInput.setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await page.locator('.receipt-input button[type="submit"]').click();
  await expect(page.getByText(/receipt on file/i).first()).toBeVisible();
});

test("an admin can change an order status from the orders list", async ({
  page,
}) => {
  await signInAdmin(page);

  await page.goto("/en/admin/orders");
  await expect(page.getByRole("link", { name: /^delivery$/i })).toHaveCount(0);

  const firstRow = page.locator("tbody tr").first();
  const trigger = firstRow.locator(".dropdown-trigger");
  await expect(trigger).toBeVisible();
  await trigger.click();

  await page.getByRole("menuitemradio", { name: /in the kitchen/i }).click();

  await expect(firstRow.locator(".dropdown-trigger")).toContainText(
    /in the kitchen/i,
  );
});

test("an admin can update an order from the order page", async ({ page }) => {
  await signInAdmin(page);

  await page.goto("/en/admin/orders");
  await page.locator("tbody tr").first().locator("a").first().click();
  await expect(page).toHaveURL(/\/en\/admin\/orders\/[a-f0-9-]+$/);

  await page.locator("#status").click();
  await page.getByRole("menuitemradio", { name: /on its way/i }).click();

  await page.locator("#paymentStatus").click();
  await page.getByRole("menuitemradio", { name: /^paid$/i }).click();

  await page.locator("#adminNotes").fill("Ready for the road.");
  await page.getByRole("button", { name: /^save changes$/i }).click();

  await expect(page).toHaveURL(/\/en\/admin\/orders\/[a-f0-9-]+\?saved=1$/);
  await expect(
    page.locator(".timeline").getByText("Ready for the road."),
  ).toBeVisible();
  await expect(page.locator(".badge").first()).toContainText(/on its way/i);
});

test("an admin can create a discount code and toggle it off", async ({
  page,
}) => {
  await signInAdmin(page);

  const code = `E2E${Date.now().toString().slice(-6)}`;

  await page.goto("/en/admin/discounts");
  await page.locator("#code").fill(code);
  await page.locator("#value").fill("15");
  await page.locator("#minSubtotal").fill("0");
  await page.getByRole("button", { name: /^create code$/i }).click();

  await expect(page).toHaveURL(/\/en\/admin\/discounts\?saved=1$/);
  await expect(page.getByText(code).first()).toBeVisible();

  const row = page.locator("tbody tr").filter({ hasText: code });
  await row.getByRole("button", { name: /^block$/i }).click();
  await expect(page).toHaveURL(/\/en\/admin\/discounts\?saved=1$/);
  await expect(page.getByText(code).first()).toBeVisible();

  // The same code cannot be created twice.
  await page.locator("#code").fill(code);
  await page.locator("#value").fill("15");
  await page.getByRole("button", { name: /^create code$/i }).click();
  await expect(page).toHaveURL(/\/en\/admin\/discounts\?error=code$/);
});

test("an admin can save the store and delivery settings", async ({ page }) => {
  await signInAdmin(page);

  await page.goto("/en/admin/settings");
  const originalPhone = await page.locator("#phone").inputValue();
  const originalAddress = await page.locator("#addressEn").inputValue();
  const originalThreshold = await page.locator("#freeThreshold").inputValue();

  try {
    // Store contact details. Navigate fresh before every save so the
    // ?saved=1 assertion always waits for that save to finish.
    await page.locator("#phone").fill("+20 100 000 0000");
    await page.locator("#addressEn").fill("1 Test Street, Maadi, Cairo");
    await page
      .getByRole("button", { name: /^save settings$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/admin\/settings\?saved=1$/, {
      timeout: 15_000,
    });

    // Free delivery switched off (the delivery form is the second card).
    await page.goto("/en/admin/settings");
    await page.locator("#freeThreshold").fill("");
    await page
      .getByRole("button", { name: /^save settings$/i })
      .nth(1)
      .click();
    await expect(page).toHaveURL(/\/en\/admin\/settings\?saved=1$/, {
      timeout: 15_000,
    });

    await page.goto("/en/admin/settings");
    await expect(page.locator("#phone")).toHaveValue("+20 100 000 0000");
    await expect(page.locator("#addressEn")).toHaveValue(
      "1 Test Street, Maadi, Cairo",
    );
    await expect(page.locator("#freeThreshold")).toHaveValue("");

    // The address reaches the storefront contact page.
    await page.goto("/en/contact");
    await expect(
      page.getByText("1 Test Street, Maadi, Cairo").first(),
    ).toBeVisible();

    // With a blank threshold there is no free-delivery note in the bag.
    await page.goto("/en/shop/pistachio-orange-blossom-croissant");
    await page
      .locator(".add-row")
      .getByRole("button", { name: /^add to bag$/i })
      .click();
    await expect(page.getByText("Added to your bag")).toBeVisible();
    await page.goto("/en/cart");
    await expect(page.locator(".free-shipping-note")).toHaveCount(0);

    // A low threshold switches free delivery back on.
    await page.goto("/en/admin/settings");
    await page.locator("#freeThreshold").fill("1");
    await page
      .getByRole("button", { name: /^save settings$/i })
      .nth(1)
      .click();
    await expect(page).toHaveURL(/\/en\/admin\/settings\?saved=1$/, {
      timeout: 15_000,
    });
    await page.goto("/en/cart");
    await expect(page.locator(".free-shipping-note")).toContainText(/free/i);
  } finally {
    // Put the original details back, even if an assertion above failed.
    await page.goto("/en/admin/settings");
    await page.locator("#phone").fill(originalPhone);
    await page.locator("#addressEn").fill(originalAddress);
    await page
      .getByRole("button", { name: /^save settings$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/admin\/settings\?saved=1$/, {
      timeout: 15_000,
    });

    await page.goto("/en/admin/settings");
    await page.locator("#freeThreshold").fill(originalThreshold);
    await page
      .getByRole("button", { name: /^save settings$/i })
      .nth(1)
      .click();
    await expect(page).toHaveURL(/\/en\/admin\/settings\?saved=1$/, {
      timeout: 15_000,
    });

    // Confirm the restore reached the database before the test ends.
    await page.goto("/en/admin/settings");
    await expect(page.locator("#freeThreshold")).toHaveValue(originalThreshold);
  }
});

test("an admin can search a customer and see their orders", async ({
  page,
}) => {
  await signInAdmin(page);

  await page.goto("/en/admin/customers");
  const search = page.getByLabel("Search customers");
  await expect(search).toBeVisible();
  await search.fill("Omar Farouk");

  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Omar Farouk");

  await rows
    .first()
    .getByRole("button", { name: /^view orders$/i })
    .click();
  const detail = page.locator(".customer-detail-row");
  await expect(detail).toBeVisible();
  await expect(
    detail.getByRole("link", { name: /^MZQ-/ }).first(),
  ).toBeVisible();
});

test("an admin can edit the homepage with the click-to-edit editor", async ({
  page,
}) => {
  await signInAdmin(page);

  await page.goto("/en/admin/settings");
  const originalTitle = await page
    .locator('input[name="heroTitleAEn"]')
    .inputValue();

  try {
    // The replica renders in front of you: click the first gallery frame to
    // edit it, upload a new photo and save.
    await page.locator(".hp-tile").first().click();
    const panel = page.locator(".hp-panel");
    await expect(panel.locator(".image-upload-preview img")).toBeVisible();
    await panel
      .locator('input[type="file"]')
      .setInputFiles("public/images/products/halawa-cookie.jpg");
    await expect(panel.locator(".image-upload-preview img")).toBeVisible();

    // Click the hero headline copy and change the opening line.
    await page
      .locator(".hp-window")
      .getByRole("button", {
        name: /^hero headline$/i,
      })
      .click();
    await panel.locator("input").first().fill("Baked for every");

    await page.getByRole("button", { name: /^save homepage$/i }).click();
    await expect(page).toHaveURL(/\/en\/admin\/settings\?saved=1$/, {
      timeout: 15_000,
    });

    await page.goto("/en");
    await expect(page.locator(".hero-title")).toContainText(/baked for every/i);
    await expect(
      page.locator(".gallery-tile").first().locator("img"),
    ).toHaveAttribute("src", /uploads/);
  } finally {
    // Put the original hero copy and gallery image back. The editor opens
    // with the hero headline selected by default.
    await page.goto("/en/admin/settings");
    await page.locator(".hp-panel input").first().fill(originalTitle);

    await page.locator(".hp-tile").first().click();
    const panel = page.locator(".hp-panel");
    await panel
      .locator('input[type="file"]')
      .setInputFiles("public/images/editorial/pastry-case.jpg");
    await expect(panel.locator(".image-upload-preview img")).toBeVisible();

    await page.getByRole("button", { name: /^save homepage$/i }).click();
    await expect(page).toHaveURL(/\/en\/admin\/settings\?saved=1$/, {
      timeout: 15_000,
    });
  }
});
