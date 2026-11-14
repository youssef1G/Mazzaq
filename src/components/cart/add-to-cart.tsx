"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { CatalogProduct } from "@/lib/catalog-types";
import { formatMoney } from "@/lib/money";
import { useCart } from "./cart-provider";

export function AddToCart({ product }: { product: CatalogProduct }) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const { addItem } = useCart();
  const availableVariants = product.variants.filter(
    (variant) => !variant.trackInventory || variant.stock > 0,
  );
  const initial =
    availableVariants.find((variant) => variant.isDefault) ??
    availableVariants[0];
  const [variantId, setVariantId] = useState(initial?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const selected = product.variants.find((variant) => variant.id === variantId);

  function handleAdd() {
    if (!selected) {
      setError(t("chooseVariant"));
      return;
    }
    setError(null);
    addItem({
      variantId: selected.id,
      productId: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      variantNameEn: selected.nameEn,
      variantNameAr: selected.nameAr,
      unitPrice: selected.price,
      imageUrl: product.imageUrl,
      quantity,
      maxQuantity: selected.trackInventory ? selected.stock : 99,
      leadTimeHours: product.leadTimeHours,
    });
    toast.success(t("added"));
  }

  if (availableVariants.length === 0) {
    return (
      <div className="add-row">
        <button type="button" className="button button-block" disabled>
          {t("soldOut")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="variant-group">
        <div className="field-label">
          <span>{t("chooseSize")}</span>
          {selected?.trackInventory && selected.stock <= 6 ? (
            <span>{t("lowStock", { count: selected.stock })}</span>
          ) : null}
        </div>
        <div className="variant-list">
          {product.variants.map((variant) => {
            const soldOut = variant.trackInventory && variant.stock <= 0;
            return (
              <button
                key={variant.id}
                type="button"
                className="variant-option"
                data-active={variant.id === variantId}
                disabled={soldOut}
                onClick={() => setVariantId(variant.id)}
              >
                <span>{locale === "ar" ? variant.nameAr : variant.nameEn}</span>
                <small>{formatMoney(variant.price, locale)}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="add-row">
        <div className="qty-stepper">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label={t("quantity")}
          >
            <Minus size={15} />
          </button>
          <span aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() => {
              const max = selected?.trackInventory
                ? Math.max(selected.stock, 1)
                : 99;
              setQuantity((value) => Math.min(max, value + 1));
            }}
            aria-label={t("quantity")}
          >
            <Plus size={15} />
          </button>
        </div>
        <button
          type="button"
          className="button"
          onClick={handleAdd}
          disabled={!selected}
        >
          <ShoppingBag size={15} />
          {t("addToCart")}
        </button>
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </>
  );
}
