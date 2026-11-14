import { unlink } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { signInAdmin } from "./helpers";

async function removeUploads(urls: string[]) {
  await Promise.all(
    urls
      .filter((url) => url.startsWith("/uploads/"))
      .map((url) =>
        unlink(path.join(process.cwd(), "public", url)).catch(() => undefined),
      ),
  );
}

test("an admin can create, edit and delete a category with an image", async ({
  page,
}) => {
  await signInAdmin(page);

  const stamp = Date.now().toString().slice(-6);
  const nameEn = `Test category ${stamp}`;
  const nameAr = `فئة تجريبية ${stamp}`;

  await page.goto("/en/admin/categories");
  await page.getByRole("link", { name: /^add category$/i }).click();
  await expect(page).toHaveURL(/\/en\/admin\/categories\/new$/);

  await page.locator("#nameEn").fill(nameEn);
  await page.locator("#nameAr").fill(nameAr);
  await page
    .locator('.image-upload input[type="file"]')
    .setInputFiles("public/images/products/halawa-cookie.jpg");
  await expect(page.locator(".image-upload-preview img")).toBeVisible();

  await page.getByRole("button", { name: /^create category$/i }).click();
  await expect(page).toHaveURL(/\/en\/admin\/categories\?saved=1$/, {
    timeout: 15_000,
  });
  await expect(page.getByRole("link", { name: nameEn })).toBeVisible();

  await page.getByRole("link", { name: nameEn }).click();
  await expect(page).toHaveURL(/\/en\/admin\/categories\/[^/]+$/, {
    timeout: 15_000,
  });
  await expect(page.locator("#descriptionEn")).toHaveCount(0);
  await expect(page.locator("#descriptionAr")).toHaveCount(0);
  const imageUrls = await page
    .locator('input[name="imageUrl"]')
    .evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    );

  await page.locator("#nameEn").fill(`${nameEn} updated`);
  await page.getByRole("button", { name: /^save category$/i }).click();
  await expect(page).toHaveURL(/\/en\/admin\/categories\?saved=1$/, {
    timeout: 15_000,
  });
  await expect(
    page.getByRole("link", { name: `${nameEn} updated` }),
  ).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("row", { name: new RegExp(nameEn) })
    .getByRole("button", { name: /^delete category$/i })
    .click();
  await expect(page).toHaveURL(/\/en\/admin\/categories\?deleted=1$/, {
    timeout: 15_000,
  });
  await expect(page.getByRole("link", { name: nameEn })).toHaveCount(0);

  await removeUploads(imageUrls);
});

test("an admin can create a product with multiple images and an auto slug", async ({
  page,
}) => {
  await signInAdmin(page);

  const stamp = Date.now().toString().slice(-6);
  const nameEn = `Test pavlova ${stamp}`;
  const nameAr = `بافلوفا تجريبية ${stamp}`;
  const slug = `test-pavlova-${stamp}`;

  await page.goto("/en/admin/products/new");
  await page.locator("#nameEn").fill(nameEn);
  await page.locator("#nameAr").fill(nameAr);
  await page.locator("#basePrice").fill("180");
  await page.locator("#v-new-nameEn").fill("Single");
  await page.locator("#v-new-nameAr").fill("فردي");
  await page.locator("#v-new-price").fill("180");
  await page.locator("#v-new-stock").fill("10");

  await page
    .locator('.product-images-field input[type="file"]')
    .setInputFiles([
      "public/images/products/halawa-cookie.jpg",
      "public/images/products/pistachio-croissant.jpg",
    ]);
  await expect(page.locator(".product-image-card")).toHaveCount(2);
  await page.locator(".product-image-card").nth(1).getByRole("radio").check();

  await page.getByRole("button", { name: /^create product$/i }).click();
  await expect(page).toHaveURL(/\/en\/admin\/products\?saved=1$/, {
    timeout: 15_000,
  });
  await expect(page.getByRole("link", { name: nameEn })).toBeVisible();

  await page.goto(`/en/shop/${slug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: nameEn }),
  ).toBeVisible();
  await expect(page.locator(".gallery-thumb")).toHaveCount(2);

  await page.goto("/en/admin/products");
  await page.getByRole("link", { name: nameEn }).click();
  await expect(page).toHaveURL(/\/en\/admin\/products\/[^/]+$/, {
    timeout: 15_000,
  });
  const imageUrls = await page
    .locator('input[name$=":url"]')
    .evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    );

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /^delete product$/i }).click();
  await expect(page).toHaveURL(/\/en\/admin\/products\?deleted=1$/, {
    timeout: 15_000,
  });
  await expect(page.getByRole("link", { name: nameEn })).toHaveCount(0);

  await removeUploads(imageUrls);
});
