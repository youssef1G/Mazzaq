"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { useCart } from "./cart-provider";

export function CartPageContent({
  freeDeliveryThreshold,
}: {
  freeDeliveryThreshold: number;
}) {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { items, hydrated, subtotal, count, updateQuantity, removeItem } =
    useCart();

  if (!hydrated) {
    return (
      <div className="shell cart-page">
        <p className="muted">{t("title")}…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="shell empty-state">
        <span className="empty-mark" aria-hidden>
          ✳
        </span>
        <h2>{t("empty")}</h2>
        <p>{t("emptyLead")}</p>
        <Link href="/shop" className="button">
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="shell cart-page">
      <header className="cart-head" data-reveal>
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-lead">{t("lead")}</p>
      </header>
      <div className="cart-layout">
        <div className="cart-lines">
          {items.map((item) => (
            <div className="cart-line" key={item.variantId}>
              <div className="cart-line-media">
                <Image
                  src={item.imageUrl}
                  alt={locale === "ar" ? item.nameAr : item.nameEn}
                  fill
                  sizes="130px"
                />
              </div>
              <div>
                <Link href={`/shop/${item.slug}`} className="cart-line-name">
                  {locale === "ar" ? item.nameAr : item.nameEn}
                </Link>
                <p className="cart-line-variant">
                  {locale === "ar" ? item.variantNameAr : item.variantNameEn}
                </p>
                <div className="cart-line-actions">
                  <div className="mini-qty">
                    <button
                      type="button"
                      aria-label={t("quantity")}
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity - 1)
                      }
                    >
                      <Minus size={12} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={t("quantity")}
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="drawer-remove"
                    onClick={() => removeItem(item.variantId)}
                  >
                    <Trash2 size={12} style={{ display: "inline" }} />{" "}
                    {t("remove")}
                  </button>
                </div>
              </div>
              <div className="cart-line-price">
                {formatMoney(item.unitPrice * item.quantity, locale)}
              </div>
            </div>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>{t("title")}</h2>
          <p className="muted small">
            {count} {count === 1 ? t("item") : t("items")}
          </p>
          <div className="summary-list">
            <div className="summary-row">
              <span>{t("subtotal")}</span>
              <span>{formatMoney(subtotal, locale)}</span>
            </div>
            <div className="summary-row">
              <span>{t("delivery")}</span>
              <span className="muted">{t("deliveryNote")}</span>
            </div>
            <div className="summary-row summary-total">
              <span>{t("total")}</span>
              <span>{formatMoney(subtotal, locale)}</span>
            </div>
          </div>
          {freeDeliveryThreshold > 0 ? (
            subtotal >= freeDeliveryThreshold ? (
              <p className="free-shipping-note">
                {t("delivery")}: {t("free")}
              </p>
            ) : (
              <p className="free-shipping-note">
                {t("freeDeliveryGap", {
                  amount: formatMoney(freeDeliveryThreshold - subtotal, locale),
                })}
              </p>
            )
          ) : null}
          <Link href="/checkout" className="button button-block">
            <ShoppingBag size={15} />
            {t("checkout")}
          </Link>
          <Link
            href="/shop"
            className="text-link"
            style={{ marginBlockStart: "1rem" }}
          >
            {t("continueShopping")}
          </Link>
          <p className="drawer-note">{t("secure")}</p>
        </aside>
      </div>
    </div>
  );
}
