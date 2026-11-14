import "server-only";

import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { discounts, productVariants } from "@/db/schema";
import type { CartInput, CartQuote, QuoteLine } from "./cart-types";
import { getDeliverySettings } from "./settings";

export type DiscountResult =
  | { ok: true; discount: typeof discounts.$inferSelect; amount: number }
  | { ok: false; reason: "invalid" | "minimum" };

export async function resolveDiscount(
  code: string,
  subtotal: number,
): Promise<DiscountResult> {
  const db = await getDb();
  const normalized = code.trim().toUpperCase();
  const row = await db.query.discounts.findFirst({
    where: eq(discounts.code, normalized),
  });
  if (!row || !row.isActive) return { ok: false, reason: "invalid" };

  const now = new Date();
  if (row.startsAt && now < row.startsAt)
    return { ok: false, reason: "invalid" };
  if (row.endsAt && now > row.endsAt) return { ok: false, reason: "invalid" };
  if (row.maxUses !== null && row.usedCount >= row.maxUses) {
    return { ok: false, reason: "invalid" };
  }
  if (subtotal < row.minSubtotal) return { ok: false, reason: "minimum" };

  const amount =
    row.type === "percentage"
      ? Math.round((subtotal * row.value) / 100)
      : Math.min(row.value, subtotal);

  return { ok: true, discount: row, amount };
}

export async function quoteCart(
  items: CartInput[],
  options: {
    discountCode?: string | null;
  } = {},
): Promise<CartQuote> {
  const clean = items
    .filter(
      (item) =>
        typeof item.variantId === "string" &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0,
    )
    .slice(0, 40)
    .map((item) => ({
      variantId: item.variantId,
      quantity: Math.min(Math.floor(item.quantity), 99),
    }));

  const settings = await getDeliverySettings();
  const db = await getDb();
  const ids = [...new Set(clean.map((item) => item.variantId))];

  const rows = ids.length
    ? await db.query.productVariants.findMany({
        where: inArray(productVariants.id, ids),
        with: {
          product: {
            with: {
              images: true,
              category: true,
            },
          },
        },
      })
    : [];

  const rowById = new Map(rows.map((row) => [row.id, row]));
  const lines: QuoteLine[] = [];
  const issues: string[] = [];

  for (const item of clean) {
    const row = rowById.get(item.variantId);
    if (!row || !row.isActive || !row.product.isActive) {
      issues.push(`unavailable:${item.variantId}`);
      continue;
    }
    const image =
      [...row.product.images].sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return a.sortOrder - b.sortOrder;
      })[0]?.url ?? "/images/placeholder.svg";
    const available = !row.trackInventory || row.stock >= item.quantity;
    if (!available) issues.push(`stock:${row.id}`);

    lines.push({
      variantId: row.id,
      productId: row.productId,
      slug: row.product.slug,
      nameEn: row.product.nameEn,
      nameAr: row.product.nameAr,
      variantNameEn: row.nameEn,
      variantNameAr: row.nameAr,
      imageUrl: image,
      unitPrice: row.price,
      quantity: item.quantity,
      lineTotal: row.price * item.quantity,
      available,
      stock: row.trackInventory ? row.stock : 999,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  let discountTotal = 0;
  let discountCode: string | null = null;
  let discountError: CartQuote["discountError"] = null;

  if (options.discountCode?.trim()) {
    const result = await resolveDiscount(options.discountCode, subtotal);
    if (result.ok) {
      discountTotal = result.amount;
      discountCode = result.discount.code;
    } else {
      discountError = result.reason;
    }
  }

  const deliveryFeeBase = settings.deliveryFee;
  // A threshold of zero means free delivery is switched off entirely.
  const deliveryFee =
    settings.freeDeliveryThreshold > 0 &&
    subtotal - discountTotal >= settings.freeDeliveryThreshold
      ? 0
      : deliveryFeeBase;

  return {
    lines,
    subtotal,
    discountTotal,
    discountCode,
    discountError,
    deliveryFee,
    deliveryFeeBase,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    total: Math.max(0, subtotal - discountTotal + deliveryFee),
    issues,
  };
}
