export type CatalogVariant = {
  id: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  trackInventory: boolean;
  isDefault: boolean;
};

export type CatalogProductImage = {
  id: string;
  url: string;
  altEn: string;
  altAr: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  shortDescriptionEn: string;
  shortDescriptionAr: string;
  descriptionEn: string;
  descriptionAr: string;
  ingredientsEn: string;
  ingredientsAr: string;
  servesEn: string;
  servesAr: string;
  basePrice: number;
  leadTimeHours: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameAr: string;
  imageUrl: string;
  imageAltEn: string;
  imageAltAr: string;
  images: CatalogProductImage[];
  variants: CatalogVariant[];
};

export type CategoryWithCount = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageUrl: string | null;
  count: number;
};

export function productName(product: CatalogProduct, locale: string) {
  return locale === "ar" ? product.nameAr : product.nameEn;
}

export function productShortDescription(
  product: CatalogProduct,
  locale: string,
) {
  return locale === "ar"
    ? product.shortDescriptionAr
    : product.shortDescriptionEn;
}

export function productDescription(product: CatalogProduct, locale: string) {
  return locale === "ar" ? product.descriptionAr : product.descriptionEn;
}

export function productIngredients(product: CatalogProduct, locale: string) {
  return locale === "ar" ? product.ingredientsAr : product.ingredientsEn;
}

export function productServes(product: CatalogProduct, locale: string) {
  return locale === "ar" ? product.servesAr : product.servesEn;
}

export function productImageAlt(product: CatalogProduct, locale: string) {
  return locale === "ar" ? product.imageAltAr : product.imageAltEn;
}

export function categoryName(category: CategoryWithCount, locale: string) {
  return locale === "ar" ? category.nameAr : category.nameEn;
}

export function categoryDescription(
  category: CategoryWithCount,
  locale: string,
) {
  return locale === "ar" ? category.descriptionAr : category.descriptionEn;
}

export function variantName(
  variant: { nameEn: string; nameAr: string },
  locale: string,
) {
  return locale === "ar" ? variant.nameAr : variant.nameEn;
}

export function lowestPrice(product: CatalogProduct): number {
  const prices = product.variants
    .filter((variant) => variant.stock > 0 || !variant.trackInventory)
    .map((variant) => variant.price);
  return prices.length ? Math.min(...prices) : product.basePrice;
}
