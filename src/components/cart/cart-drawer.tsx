"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { useCart } from "./cart-provider";

export function CartDrawer({
  freeDeliveryThreshold,
}: {
  freeDeliveryThreshold: number;
}) {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const {
    items,
    count,
    subtotal,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
  } = useCart();

  const freeDeliveryOn = freeDeliveryThreshold > 0;
  const remaining = Math.max(0, freeDeliveryThreshold - subtotal);
  const unlocked = freeDeliveryOn && remaining === 0;
  const progress = freeDeliveryOn
    ? Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100))
    : 0;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="drawer" aria-describedby={undefined}>
          <div className="drawer-head">
            <div className="drawer-heading">
              <span className="drawer-eyebrow">{t("eyebrow")}</span>
              <Dialog.Title className="drawer-title">
                {t("title")}
                <span className="drawer-count">{count}</span>
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="button-icon drawer-close"
                aria-label={t("close")}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          <div className="drawer-body">
            {items.length === 0 ? (
              <div className="drawer-empty">
                <span className="empty-mark" aria-hidden>
                  ✳
                </span>
                <h3>{t("empty")}</h3>
                <p>{t("emptyLead")}</p>
                <Dialog.Close asChild>
                  <Link href="/shop" className="button">
                    {t("continueShopping")}
                  </Link>
                </Dialog.Close>
              </div>
            ) : (
              <div className="drawer-lines">
                {items.map((item) => (
                  <div className="drawer-line" key={item.variantId}>
                    <Link
                      href={`/shop/${item.slug}`}
                      className="drawer-line-media"
                      onClick={closeCart}
                    >
                      <Image
                        src={item.imageUrl}
                        alt={locale === "ar" ? item.nameAr : item.nameEn}
                        fill
                        sizes="84px"
                      />
                    </Link>
                    <div className="drawer-line-body">
                      <div className="drawer-line-top">
                        <Link
                          href={`/shop/${item.slug}`}
                          className="drawer-line-name"
                          onClick={closeCart}
                        >
                          {locale === "ar" ? item.nameAr : item.nameEn}
                        </Link>
                        <span className="drawer-line-price">
                          {formatMoney(item.unitPrice * item.quantity, locale)}
                        </span>
                      </div>
                      <p className="drawer-line-variant">
                        {locale === "ar"
                          ? item.variantNameAr
                          : item.variantNameEn}
                      </p>
                      <div className="drawer-line-controls">
                        <div className="mini-qty">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            aria-label={t("quantity")}
                          >
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            aria-label={t("quantity")}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="drawer-remove"
                          onClick={() => removeItem(item.variantId)}
                        >
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 ? (
            <div className="drawer-foot">
              {freeDeliveryOn ? (
                <div className="drawer-progress" data-unlocked={unlocked}>
                  <div className="drawer-progress-head">
                    <span>
                      {unlocked
                        ? t("freeDeliveryUnlocked")
                        : t("freeDeliveryGap", {
                            amount: formatMoney(remaining, locale),
                          })}
                    </span>
                    <span className="drawer-progress-value">{progress}%</span>
                  </div>
                  <div className="drawer-progress-track" aria-hidden>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : null}

              <div className="drawer-summary">
                <div className="summary-row">
                  <span>{t("subtotal")}</span>
                  <span>{formatMoney(subtotal, locale)}</span>
                </div>
                <div className="summary-row">
                  <span>{t("delivery")}</span>
                  <span className="muted">{t("deliveryNote")}</span>
                </div>
              </div>

              <div className="drawer-actions">
                <Link
                  href="/checkout"
                  className="button button-block"
                  onClick={closeCart}
                >
                  <ShoppingBag size={15} />
                  {t("checkout")}
                </Link>
                <Dialog.Close asChild>
                  <Link
                    href="/cart"
                    className="drawer-secondary"
                    onClick={closeCart}
                  >
                    {t("viewCart")}
                    <ArrowRight size={13} strokeWidth={1.6} />
                  </Link>
                </Dialog.Close>
              </div>

              <p className="drawer-note">{t("secure")}</p>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
