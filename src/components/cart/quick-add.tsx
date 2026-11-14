"use client";

import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { CatalogProduct } from "@/lib/catalog-types";
import { useCart } from "./cart-provider";

export function QuickAdd({ product }: { product: CatalogProduct }) {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { addItem } = useCart();
  const variant =
    product.variants.find(
      (item) => item.isDefault && (!item.trackInventory || item.stock > 0),
    ) ??
    product.variants.find((item) => !item.trackInventory || item.stock > 0);

  if (!variant) {
    return (
      <button type="button" className="quick-add" disabled>
        {t("outOfStock")}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="quick-add"
      onClick={() => {
        addItem({
          variantId: variant.id,
          productId: product.id,
          slug: product.slug,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          variantNameEn: variant.nameEn,
          variantNameAr: variant.nameAr,
          unitPrice: variant.price,
          imageUrl: product.imageUrl,
          quantity: 1,
          maxQuantity: variant.trackInventory ? variant.stock : 99,
          leadTimeHours: product.leadTimeHours,
        });
        toast.success(t("added"));
      }}
    >
      {t("addToBag")}
      <span className="sr-only">
        {locale === "ar" ? product.nameAr : product.nameEn}
      </span>
    </button>
  );
}
