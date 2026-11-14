import "server-only";

import { and, asc, desc, eq, ilike, ne, or, type SQL, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  categories,
  orderItems,
  type productImages,
  products,
  type productVariants,
} from "@/db/schema";
import type { CatalogProduct, CategoryWithCount } from "./catalog-types";

type ProductRow = typeof products.$inferSelect & {
  category: typeof categories.$inferSelect;
  images: (typeof productImages.$inferSelect)[];
  variants: (typeof productVariants.$inferSelect)[];
};

export function mapProduct(row: ProductRow): CatalogProduct {
  const sortedImages = [...row.images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
  const image = sortedImages[0];

  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    shortDescriptionEn: row.shortDescriptionEn,
    shortDescriptionAr: row.shortDescriptionAr,
    descriptionEn: row.descriptionEn,
    descriptionAr: row.descriptionAr,
    ingredientsEn: row.ingredientsEn,
    ingredientsAr: row.ingredientsAr,
    servesEn: row.servesEn,
    servesAr: row.servesAr,
    basePrice: row.basePrice,
    leadTimeHours: row.leadTimeHours,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    categoryId: row.categoryId,
    categorySlug: row.category.slug,
    categoryNameEn: row.category.nameEn,
    categoryNameAr: row.category.nameAr,
    imageUrl: image?.url ?? "/images/placeholder.svg",
    imageAltEn: image?.altEn ?? row.nameEn,
    imageAltAr: image?.altAr ?? row.nameAr,
    images: sortedImages.map((image) => ({
      id: image.id,
      url: image.url,
      altEn: image.altEn,
      altAr: image.altAr,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    })),
    variants: row.variants
      .filter((variant) => variant.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        nameEn: variant.nameEn,
        nameAr: variant.nameAr,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        stock: variant.stock,
        trackInventory: variant.trackInventory,
        isDefault: variant.isDefault,
      })),
  };
}

const withRelations = {
  category: true,
  images: true,
  variants: true,
} as const;

export async function getCatalogProducts(options?: {
  categorySlug?: string;
  query?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
  limit?: number;
}): Promise<CatalogProduct[]> {
  const db = await getDb();
  const filters: SQL[] = [eq(products.isActive, true)];

  if (options?.categorySlug) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, options.categorySlug),
    });
    if (!category) return [];
    filters.push(eq(products.categoryId, category.id));
  }

  if (options?.query?.trim()) {
    const term = `%${options.query.trim()}%`;
    const search = or(
      ilike(products.nameEn, term),
      ilike(products.nameAr, term),
      ilike(products.shortDescriptionEn, term),
      ilike(products.shortDescriptionAr, term),
    );
    if (search) filters.push(search);
  }

  const orderBy =
    options?.sort === "price-asc"
      ? [asc(products.basePrice)]
      : options?.sort === "price-desc"
        ? [desc(products.basePrice)]
        : options?.sort === "newest"
          ? [desc(products.createdAt)]
          : options?.sort === "featured"
            ? [asc(products.sortOrder), asc(products.nameEn)]
            : [asc(products.nameEn)];

  const rows = await db.query.products.findMany({
    where: and(...filters),
    with: withRelations,
    orderBy,
    limit: options?.limit,
  });

  return rows.map(mapProduct);
}

export async function getFeaturedProducts(limit = 6) {
  const db = await getDb();
  const rows = await db.query.products.findMany({
    where: and(eq(products.isActive, true), eq(products.isFeatured, true)),
    with: withRelations,
    orderBy: [asc(products.sortOrder)],
    limit,
  });
  return rows.map(mapProduct);
}

/** The product customers order most often — the natural feature for menus. */
export async function getBestSellerProduct(): Promise<CatalogProduct | null> {
  const db = await getDb();
  const totals = await db
    .select({
      productId: orderItems.productId,
      sold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    })
    .from(orderItems)
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`coalesce(sum(${orderItems.quantity}), 0)::int`))
    .limit(1);

  const productId = totals[0]?.productId;
  if (productId) {
    const row = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.isActive, true)),
      with: withRelations,
    });
    if (row) return mapProduct(row);
  }

  const featured = await getFeaturedProducts(1);
  return featured[0] ?? null;
}

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const db = await getDb();
  const row = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
    with: withRelations,
  });
  return row ? mapProduct(row) : null;
}

export async function getRelatedProducts(
  product: CatalogProduct,
  limit = 3,
): Promise<CatalogProduct[]> {
  const db = await getDb();
  const rows = await db.query.products.findMany({
    where: and(
      eq(products.isActive, true),
      eq(products.categoryId, product.categoryId),
      ne(products.id, product.id),
    ),
    with: withRelations,
    orderBy: [asc(products.sortOrder)],
    limit,
  });
  if (rows.length >= limit) return rows.map(mapProduct);

  const fallback = await db.query.products.findMany({
    where: and(eq(products.isActive, true), ne(products.id, product.id)),
    with: withRelations,
    orderBy: [asc(products.sortOrder)],
    limit,
  });
  const seen = new Set(rows.map((row) => row.id));
  const merged = [...rows];
  for (const row of fallback) {
    if (merged.length >= limit) break;
    if (!seen.has(row.id)) {
      merged.push(row);
      seen.add(row.id);
    }
  }
  return merged.map(mapProduct);
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const db = await getDb();
  const rows = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: [asc(categories.nameEn)],
  });
  const counts = await db
    .select({
      categoryId: products.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .groupBy(products.categoryId);
  const countMap = new Map(counts.map((row) => [row.categoryId, row.count]));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    descriptionEn: row.descriptionEn,
    descriptionAr: row.descriptionAr,
    imageUrl: row.imageUrl,
    count: countMap.get(row.id) ?? 0,
  }));
}

export async function getAllProductsForAdmin() {
  const db = await getDb();
  const rows = await db.query.products.findMany({
    with: withRelations,
    orderBy: [asc(products.sortOrder), asc(products.nameEn)],
  });
  return rows.map(mapProduct);
}

export async function getCategoriesForAdmin() {
  const db = await getDb();
  return db.query.categories.findMany({
    orderBy: [asc(categories.nameEn)],
  });
}
