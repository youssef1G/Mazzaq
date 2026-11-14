"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import type { OrderStatus, PaymentStatus } from "@/db/schema";
import {
  categories,
  discounts,
  orderEvents,
  orders,
  productImages,
  products,
  productVariants,
  settings,
} from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { getDeliverySettings } from "@/lib/settings";
import { homeSettingsSchema } from "@/lib/settings-schema";

function toPiastres(value: FormDataEntryValue | null) {
  const amount = Number(String(value ?? "0").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.round(amount * 100));
}

function toInt(value: FormDataEntryValue | null, fallback = 0) {
  const amount = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? Math.trunc(amount) : fallback;
}

function checked(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                      */
/* -------------------------------------------------------------------------- */

const statusSchema = z.enum([
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled",
]);

const paymentSchema = z.enum(["unpaid", "paid", "refunded"]);

export async function updateOrder(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const session = await requireAdmin(locale);
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) redirect(`/${locale}/admin/orders`);

  const statusParsed = statusSchema.safeParse(formData.get("status"));
  const paymentParsed = paymentSchema.safeParse(formData.get("paymentStatus"));
  const adminNotes = String(formData.get("adminNotes") ?? "").slice(0, 2000);
  const deliveryDateRaw = String(formData.get("deliveryDate") ?? "").trim();
  const deliveryWindowRaw = String(formData.get("deliveryWindow") ?? "").trim();

  if (!statusParsed.success || !paymentParsed.success) {
    redirect(`/${locale}/admin/orders/${orderId}?error=invalid`);
  }

  if (deliveryDateRaw && !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDateRaw)) {
    redirect(`/${locale}/admin/orders/${orderId}?error=date`);
  }

  const deliverySettings = await getDeliverySettings();
  if (
    deliveryWindowRaw &&
    !deliverySettings.deliveryWindows.some(
      (window) => window.key === deliveryWindowRaw,
    )
  ) {
    redirect(`/${locale}/admin/orders/${orderId}?error=window`);
  }

  const deliveryDate = deliveryDateRaw || null;
  const deliveryWindow = deliveryDate ? deliveryWindowRaw || null : null;

  const db = await getDb();
  const current = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: {
      status: true,
      paymentStatus: true,
      deliveryDate: true,
      deliveryWindow: true,
      confirmedAt: true,
    },
  });
  if (!current) redirect(`/${locale}/admin/orders`);

  const status = statusParsed.data as OrderStatus;
  const paymentStatus = paymentParsed.data as PaymentStatus;

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status,
        paymentStatus,
        deliveryDate,
        deliveryWindow,
        adminNotes: adminNotes || null,
        confirmedAt:
          status === "cancelled" ? null : (current.confirmedAt ?? new Date()),
        completedAt: status === "completed" ? new Date() : null,
      })
      .where(eq(orders.id, orderId));

    if (current.status !== status) {
      await tx.insert(orderEvents).values({
        orderId,
        type: "status-changed",
        message: `Status changed to ${status}.`,
        actorId: session.user.id,
      });
    }
    if (current.paymentStatus !== paymentStatus) {
      await tx.insert(orderEvents).values({
        orderId,
        type: "payment-changed",
        message: `Payment marked ${paymentStatus}.`,
        actorId: session.user.id,
      });
    }
    if (
      current.deliveryDate !== deliveryDate ||
      current.deliveryWindow !== deliveryWindow
    ) {
      await tx.insert(orderEvents).values({
        orderId,
        type: "delivery-scheduled",
        message: deliveryDate
          ? `Delivery scheduled for ${deliveryDate}${deliveryWindow ? ` (${deliveryWindow})` : ""}.`
          : "Delivery schedule cleared.",
        actorId: session.user.id,
      });
    }
    if (adminNotes) {
      await tx.insert(orderEvents).values({
        orderId,
        type: "note",
        message: adminNotes,
        actorId: session.user.id,
      });
    }
  });

  revalidatePath(`/${locale}/admin/orders`);
  revalidatePath(`/${locale}/admin/orders/${orderId}`);
  redirect(`/${locale}/admin/orders/${orderId}?saved=1`);
}

/**
 * Inline status editing from the orders list. It only touches the status so
 * a quick change can never wipe delivery details or internal notes.
 */
export async function updateOrderStatus(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const session = await requireAdmin(locale);
  const orderId = String(formData.get("orderId") ?? "");
  const parsed = statusSchema.safeParse(formData.get("status"));

  if (!orderId || !parsed.success) {
    redirect(`/${locale}/admin/orders`);
  }

  const db = await getDb();
  const current = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { status: true, confirmedAt: true },
  });
  if (!current) redirect(`/${locale}/admin/orders`);

  const status = parsed.data as OrderStatus;

  if (current.status !== status) {
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          status,
          confirmedAt:
            status === "cancelled" ? null : (current.confirmedAt ?? new Date()),
          completedAt: status === "completed" ? new Date() : null,
        })
        .where(eq(orders.id, orderId));
      await tx.insert(orderEvents).values({
        orderId,
        type: "status-changed",
        message: `Status changed to ${status}.`,
        actorId: session.user.id,
      });
    });
  }

  revalidatePath(`/${locale}/admin/orders`);
  revalidatePath(`/${locale}/admin/orders/${orderId}`);

  const returnTo = String(formData.get("returnTo") ?? "");
  redirect(
    returnTo.startsWith(`/${locale}/admin/orders`)
      ? returnTo
      : `/${locale}/admin/orders`,
  );
}

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

function collectVariants(formData: FormData) {
  const map = new Map<string, Record<string, string>>();
  for (const [key, raw] of formData.entries()) {
    const match = /^v:([^:]+):(.+)$/.exec(key);
    if (!match) continue;
    const id = match[1];
    const field = match[2];
    if (!id || !field) continue;
    const bucket = map.get(id) ?? {};
    bucket[field] = String(raw);
    map.set(id, bucket);
  }
  return map;
}

export async function saveProduct(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  await requireAdmin(locale);

  const id = String(formData.get("id") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();

  if (!nameEn || !nameAr || !categoryId) {
    redirect(`/${locale}/admin/products/${id || "new"}?error=required`);
  }

  const db = await getDb();
  const slugBase = slugify(nameEn);
  if (!slugBase) {
    redirect(`/${locale}/admin/products/${id || "new"}?error=required`);
  }

  const clash = await db.query.products.findFirst({
    where: eq(products.slug, slugBase),
    columns: { id: true },
  });
  if (clash && clash.id !== id) {
    redirect(`/${locale}/admin/products/${id || "new"}?error=slug`);
  }

  const productValues = {
    categoryId,
    slug: slugBase,
    nameEn,
    nameAr,
    shortDescriptionEn: String(formData.get("shortDescriptionEn") ?? "").trim(),
    shortDescriptionAr: String(formData.get("shortDescriptionAr") ?? "").trim(),
    descriptionEn: String(formData.get("descriptionEn") ?? "").trim(),
    descriptionAr: String(formData.get("descriptionAr") ?? "").trim(),
    servesEn: String(formData.get("servesEn") ?? "").trim(),
    servesAr: String(formData.get("servesAr") ?? "").trim(),
    basePrice: toPiastres(formData.get("basePrice")),
    leadTimeHours: Math.max(0, toInt(formData.get("leadTimeHours"), 48)),
    isActive: checked(formData.get("isActive")),
    isFeatured: checked(formData.get("isFeatured")),
  };

  const variants = collectVariants(formData);

  let productId = id;

  await db.transaction(async (tx) => {
    if (id) {
      await tx.update(products).set(productValues).where(eq(products.id, id));
      productId = id;
    } else {
      const [created] = await tx
        .insert(products)
        .values(productValues)
        .returning({ id: products.id });
      if (!created) throw new Error("PRODUCT_FAILED");
      productId = created.id;
    }

    const existingVariants = await tx.query.productVariants.findMany({
      where: eq(productVariants.productId, productId),
      columns: { id: true, sku: true },
    });
    const existingIds = new Set(existingVariants.map((row) => row.id));
    const existingSkus = new Map(
      existingVariants.map((row) => [row.id, row.sku]),
    );
    const allSkus = await tx
      .select({ sku: productVariants.sku })
      .from(productVariants);
    const usedSkus = new Set([
      ...allSkus.map((row) => row.sku),
      ...existingVariants.map((row) => row.sku),
    ]);

    const defaultId = String(formData.get("defaultVariant") ?? "");
    let newVariantIndex = 0;

    for (const [variantId, values] of variants) {
      const nameEnValue = (values.nameEn ?? "").trim();
      const nameArValue = (values.nameAr ?? "").trim();
      const price = toPiastres(values.price ?? null);
      if (!nameEnValue || !nameArValue || price <= 0) continue;

      const stock = Math.max(0, toInt(values.stock ?? null, 0));
      const compareAtRaw = values.compareAt;
      const compareAt =
        compareAtRaw === undefined ? undefined : toPiastres(compareAtRaw);

      let sku = existingSkus.get(variantId) ?? "";
      if (variantId === "new" || !sku) {
        newVariantIndex += 1;
        sku = `${slugBase}-${String(newVariantIndex).padStart(2, "0")}`;
        while (usedSkus.has(sku)) {
          newVariantIndex += 1;
          sku = `${slugBase}-${String(newVariantIndex).padStart(2, "0")}`;
        }
        usedSkus.add(sku);
      }

      if (variantId === "new") {
        const [created] = await tx
          .insert(productVariants)
          .values({
            productId,
            sku,
            nameEn: nameEnValue,
            nameAr: nameArValue,
            price,
            compareAtPrice: compareAt ?? null,
            stock,
            trackInventory: true,
            isDefault: defaultId === "new" || defaultId === "",
            isActive: true,
            sortOrder: existingIds.size,
          })
          .returning({ id: productVariants.id });
        if (created) existingIds.add(created.id);
      } else if (existingIds.has(variantId)) {
        await tx
          .update(productVariants)
          .set({
            sku,
            nameEn: nameEnValue,
            nameAr: nameArValue,
            price,
            ...(compareAt === undefined ? {} : { compareAtPrice: compareAt }),
            stock,
            isDefault: defaultId === variantId,
            isActive: true,
          })
          .where(eq(productVariants.id, variantId));
      }
    }

    if (existingIds.size > 0) {
      const hasDefault = await tx.query.productVariants.findFirst({
        where: and(
          eq(productVariants.productId, productId),
          eq(productVariants.isDefault, true),
        ),
        columns: { id: true },
      });
      if (!hasDefault) {
        const fallback = await tx.query.productVariants.findFirst({
          where: eq(productVariants.productId, productId),
          columns: { id: true },
        });
        if (fallback) {
          await tx
            .update(productVariants)
            .set({ isDefault: true })
            .where(eq(productVariants.id, fallback.id));
        }
      }
    }

    const imageEntries: {
      url: string;
      altEn: string;
      altAr: string;
      primary: boolean;
    }[] = [];
    for (const [key, raw] of formData.entries()) {
      const match = /^image:(\d+):url$/.exec(key);
      if (!match || !match[1]) continue;
      const index = match[1];
      const url = String(raw).trim();
      if (!url) continue;
      imageEntries.push({
        url,
        altEn: String(formData.get(`image:${index}:altEn`) ?? "").trim(),
        altAr: String(formData.get(`image:${index}:altAr`) ?? "").trim(),
        primary: String(formData.get(`image:${index}:primary`) ?? "") === "1",
      });
    }
    if (
      imageEntries.length > 0 &&
      !imageEntries.some((image) => image.primary)
    ) {
      const first = imageEntries[0];
      if (first) first.primary = true;
    }

    await tx
      .delete(productImages)
      .where(eq(productImages.productId, productId));
    if (imageEntries.length > 0) {
      await tx.insert(productImages).values(
        imageEntries.map((image, index) => ({
          productId,
          url: image.url,
          altEn: image.altEn,
          altAr: image.altAr,
          sortOrder: index,
          isPrimary: image.primary,
        })),
      );
    }
  });

  revalidatePath(`/${locale}/admin/products`);
  redirect(`/${locale}/admin/products?saved=1`);
}

export async function deleteProduct(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  await requireAdmin(locale);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/${locale}/admin/products`);

  const db = await getDb();
  await db.delete(products).where(eq(products.id, id));

  revalidatePath(`/${locale}/admin/products`);
  redirect(`/${locale}/admin/products?deleted=1`);
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export async function saveCategory(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  await requireAdmin(locale);

  const id = String(formData.get("id") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!nameEn || !nameAr) {
    redirect(`/${locale}/admin/categories/${id || "new"}?error=required`);
  }

  const slugBase = slugify(nameEn);
  if (!slugBase) {
    redirect(`/${locale}/admin/categories/${id || "new"}?error=required`);
  }

  const db = await getDb();
  const existing = id
    ? await db.query.categories.findFirst({
        where: eq(categories.id, id),
        columns: { id: true, sortOrder: true },
      })
    : null;
  if (id && !existing) redirect(`/${locale}/admin/categories`);

  const clash = await db.query.categories.findFirst({
    where: eq(categories.slug, slugBase),
    columns: { id: true },
  });
  if (clash && clash.id !== id) {
    redirect(`/${locale}/admin/categories/${id || "new"}?error=slug`);
  }

  const values = {
    slug: slugBase,
    nameEn,
    nameAr,
    imageUrl: imageUrl || null,
    isActive: checked(formData.get("isActive")),
    sortOrder: existing?.sortOrder ?? 0,
  };

  if (id) {
    await db.update(categories).set(values).where(eq(categories.id, id));
  } else {
    await db.insert(categories).values(values);
  }

  revalidatePath(`/${locale}/admin/categories`);
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/admin/categories?saved=1`);
}

export async function deleteCategory(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  await requireAdmin(locale);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/${locale}/admin/categories`);

  const db = await getDb();
  const used = await db.query.products.findMany({
    where: eq(products.categoryId, id),
    columns: { id: true },
    limit: 1,
  });
  if (used.length > 0) {
    redirect(`/${locale}/admin/categories/${id}?error=products`);
  }

  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath(`/${locale}/admin/categories`);
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/admin/categories?deleted=1`);
}

/* -------------------------------------------------------------------------- */
/* Discounts                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveDiscount(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  await requireAdmin(locale);

  const id = String(formData.get("id") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const type = String(formData.get("type") ?? "percentage");
  if (!code) redirect(`/${locale}/admin/discounts?error=required`);

  const db = await getDb();
  const existing = await db.query.discounts.findFirst({
    where: eq(discounts.code, code),
    columns: { id: true },
  });
  if (existing && existing.id !== id) {
    redirect(`/${locale}/admin/discounts?error=code`);
  }

  const rawValue = toInt(formData.get("value"), 0);
  const value =
    type === "percentage"
      ? Math.max(0, Math.min(100, rawValue))
      : rawValue * 100;
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const endsAtRaw = String(formData.get("endsAt") ?? "").trim();
  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();

  const values = {
    code,
    type: type === "fixed" ? ("fixed" as const) : ("percentage" as const),
    value,
    minSubtotal: toPiastres(formData.get("minSubtotal")),
    startsAt: startsAtRaw ? new Date(startsAtRaw) : null,
    endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
    maxUses: maxUsesRaw ? Math.max(1, toInt(maxUsesRaw, 1)) : null,
    isActive: checked(formData.get("isActive")),
  };

  if (id) {
    await db.update(discounts).set(values).where(eq(discounts.id, id));
  } else {
    await db.insert(discounts).values(values);
  }

  revalidatePath(`/${locale}/admin/discounts`);
  redirect(`/${locale}/admin/discounts?saved=1`);
}

export async function toggleDiscount(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  await requireAdmin(locale);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/${locale}/admin/discounts`);

  const db = await getDb();
  const row = await db.query.discounts.findFirst({
    where: eq(discounts.id, id),
    columns: { id: true, isActive: true },
  });
  if (!row) redirect(`/${locale}/admin/discounts`);

  await db
    .update(discounts)
    .set({ isActive: !row.isActive })
    .where(eq(discounts.id, id));

  revalidatePath(`/${locale}/admin/discounts`);
  redirect(`/${locale}/admin/discounts?saved=1`);
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

const storeSchema = z.object({
  phone: z.string().trim().min(1),
  whatsapp: z.string().trim().min(1),
  email: z.string().trim().email(),
  addressEn: z.string().trim().min(1),
  addressAr: z.string().trim().min(1),
  instapayHandle: z.string().trim().min(1),
  instagram: z.string().trim().min(1),
});

export async function saveStoreSettings(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  await requireAdmin(locale);

  const parsed = storeSchema.safeParse({
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    addressEn: formData.get("addressEn"),
    addressAr: formData.get("addressAr"),
    instapayHandle: formData.get("instapayHandle"),
    instagram: formData.get("instagram"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/admin/settings?error=required`);
  }

  const db = await getDb();
  await db
    .insert(settings)
    .values({ key: "store", value: parsed.data })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: parsed.data },
    });

  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/admin/settings?saved=1`);
}

export async function saveDeliverySettings(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  await requireAdmin(locale);

  const current = await getDeliverySettings();

  // A blank threshold means free delivery is disabled: no order unlocks it.
  const value = {
    ...current,
    deliveryFee: toPiastres(formData.get("deliveryFee")),
    freeDeliveryThreshold: toPiastres(formData.get("freeThreshold")),
  };

  const db = await getDb();
  await db
    .insert(settings)
    .values({ key: "delivery", value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    });

  revalidatePath(`/${locale}/admin/settings`);
  redirect(`/${locale}/admin/settings?saved=1`);
}

export async function saveHomeSettings(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  await requireAdmin(locale);

  const shapes = ["is-tall", "is-wide", "is-square"];
  const gallery = Array.from({ length: 6 }, (_, index) => {
    const shape = String(formData.get(`galleryShape${index}`) ?? "");
    return {
      src: String(formData.get(`galleryImage${index}`) ?? "").trim(),
      captionEn: String(formData.get(`galleryCaptionEn${index}`) ?? "").trim(),
      captionAr: String(formData.get(`galleryCaptionAr${index}`) ?? "").trim(),
      shape: shapes.includes(shape) ? shape : "is-square",
    };
  });

  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const parsed = homeSettingsSchema.safeParse({
    heroImage: text("heroImage"),
    heroTitleAEn: text("heroTitleAEn"),
    heroTitleAAr: text("heroTitleAAr"),
    heroTitleEmEn: text("heroTitleEmEn"),
    heroTitleEmAr: text("heroTitleEmAr"),
    heroTitleBEn: text("heroTitleBEn"),
    heroTitleBAr: text("heroTitleBAr"),
    heroLeadEn: text("heroLeadEn"),
    heroLeadAr: text("heroLeadAr"),
    galleryTitleEn: text("galleryTitleEn"),
    galleryTitleAr: text("galleryTitleAr"),
    galleryLeadEn: text("galleryLeadEn"),
    galleryLeadAr: text("galleryLeadAr"),
    ctaTitleEn: text("ctaTitleEn"),
    ctaTitleAr: text("ctaTitleAr"),
    ctaLeadEn: text("ctaLeadEn"),
    ctaLeadAr: text("ctaLeadAr"),
    ctaButtonEn: text("ctaButtonEn"),
    ctaButtonAr: text("ctaButtonAr"),
    gallery,
  });

  if (!parsed.success) {
    redirect(`/${locale}/admin/settings?error=required`);
  }

  const db = await getDb();
  await db
    .insert(settings)
    .values({ key: "home", value: parsed.data })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: parsed.data },
    });

  revalidatePath(`/${locale}/admin/settings`);
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/admin/settings?saved=1`);
}
