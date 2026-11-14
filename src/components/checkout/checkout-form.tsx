"use client";

import { CalendarDays, Check, Copy, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { checkDiscount, placeOrder } from "@/actions/checkout";
import { useCart } from "@/components/cart/cart-provider";
import { Link } from "@/i18n/navigation";
import { type CheckoutState, initialCheckoutState } from "@/lib/checkout-state";
import { formatMoney } from "@/lib/money";
import type { StoreSettings } from "@/lib/settings-schema";

export function CheckoutForm({
  store,
  deliveryFee,
  freeDeliveryThreshold,
  user,
}: {
  store: StoreSettings;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  user: { name: string; email: string } | null;
}) {
  const t = useTranslations("Checkout");
  const common = useTranslations("Common");
  const cartT = useTranslations("Cart");
  const locale = useLocale();
  const { items, hydrated, subtotal, count } = useCart();
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    placeOrder,
    initialCheckoutState,
  );

  const [payment, setPayment] = useState<"cod" | "instapay">("cod");
  const [discount, setDiscount] = useState("");
  const [discountResult, setDiscountResult] = useState<{
    ok: boolean;
    code: string | null;
    amount: number;
    reason: "invalid" | "minimum" | null;
  } | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [copied, setCopied] = useState(false);

  const discountAmount = discountResult?.ok ? discountResult.amount : 0;
  const computedDelivery =
    freeDeliveryThreshold > 0 &&
    subtotal - discountAmount >= freeDeliveryThreshold
      ? 0
      : deliveryFee;
  const total = Math.max(0, subtotal - discountAmount + computedDelivery);

  async function applyDiscount() {
    if (!discount.trim()) return;
    setCheckingDiscount(true);
    try {
      const result = await checkDiscount(discount, subtotal);
      setDiscountResult(result);
    } finally {
      setCheckingDiscount(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="shell checkout-page">
        <p className="muted">{common("loading")}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="shell empty-state">
        <span className="empty-mark" aria-hidden>
          ✳
        </span>
        <h2>{t("emptyCart")}</h2>
        <Link href="/shop" className="button">
          {cartT("continueShopping")}
        </Link>
      </div>
    );
  }

  const errorKey = state.error;

  return (
    <form action={formAction} className="shell checkout-page">
      <input type="hidden" name="locale" value={locale} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        )}
      />
      <input type="hidden" name="payment" value={payment} />
      <input
        type="hidden"
        name="discountCode"
        value={discountResult?.ok ? (discountResult.code ?? "") : ""}
      />

      <div className="page-head-grid">
        <div>
          <span className="eyebrow">{t("title")}</span>
          <h1 className="page-title">{t("lead")}</h1>
        </div>
        <p className="page-lead">{t("secure")}</p>
      </div>

      <div className="checkout-layout">
        <div className="checkout-form">
          <section className="form-section">
            <div className="form-section-head">
              <span className="step-number">01</span>
              <h2 className="form-section-title">{t("contact")}</h2>
              <span className="form-section-sub">{t("contactLead")}</span>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">{t("name")}</label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={user?.name ?? ""}
                  className="input"
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label htmlFor="phone">{t("phone")}</label>
                <input
                  id="phone"
                  name="phone"
                  required
                  className="input"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
              <div className="field span-2">
                <label htmlFor="email">{t("email")}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={user?.email ?? ""}
                  className="input"
                  autoComplete="email"
                />
              </div>
            </div>
            {!user ? (
              <p className="form-note" style={{ marginBlockStart: "0.9rem" }}>
                {t("loginPrompt")}{" "}
                <Link href="/sign-in" className="text-link">
                  {t("login")}
                </Link>
              </p>
            ) : null}
          </section>

          <section className="form-section">
            <div className="form-section-head">
              <span className="step-number">02</span>
              <h2 className="form-section-title">{t("fulfillment")}</h2>
              <span className="form-section-sub">{t("addressLead")}</span>
            </div>

            <div className="form-grid">
              <div className="field span-2">
                <label htmlFor="line1">{t("line1")}</label>
                <input
                  id="line1"
                  name="line1"
                  className="input"
                  required
                  autoComplete="address-line1"
                />
              </div>
              <div className="field span-2">
                <label htmlFor="line2">{t("line2")}</label>
                <input
                  id="line2"
                  name="line2"
                  className="input"
                  autoComplete="address-line2"
                />
              </div>
              <div className="field">
                <label htmlFor="area">{t("area")}</label>
                <input
                  id="area"
                  name="area"
                  className="input"
                  required
                  autoComplete="address-level2"
                />
              </div>
              <div className="field">
                <label htmlFor="city">{t("city")}</label>
                <input
                  id="city"
                  name="city"
                  className="input"
                  required
                  defaultValue="Cairo"
                  autoComplete="address-level1"
                />
              </div>
            </div>

            <p className="checkout-delivery-note">
              <CalendarDays size={16} strokeWidth={1.6} aria-hidden />
              {t("scheduleNote")}
            </p>
          </section>

          <section className="form-section">
            <div className="form-section-head">
              <span className="step-number">03</span>
              <h2 className="form-section-title">{t("payment")}</h2>
              <span className="form-section-sub">{t("paymentLead")}</span>
            </div>
            <div className="radio-cards">
              <label className="radio-card" data-active={payment === "cod"}>
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={payment === "cod"}
                  onChange={() => setPayment("cod")}
                />
                <strong>{t("cod")}</strong>
                <span>{t("codBody")}</span>
              </label>
              <label
                className="radio-card"
                data-active={payment === "instapay"}
              >
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={payment === "instapay"}
                  onChange={() => setPayment("instapay")}
                />
                <strong>{t("instapay")}</strong>
                <span>{t("instapayBody")}</span>
              </label>
            </div>

            {payment === "instapay" ? (
              <div className="payment-panel">
                <p className="field-label">
                  <span>{t("instapayHandle")}</span>
                </p>
                <div className="instapay-handle">
                  <code>{store.instapayHandle}</code>
                  <button
                    type="button"
                    className="button-icon"
                    aria-label={common("copy")}
                    onClick={async () => {
                      await navigator.clipboard.writeText(store.instapayHandle);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1600);
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="form-note" style={{ marginBlockStart: "0.9rem" }}>
                  {t("instapayLater")}
                </p>
              </div>
            ) : null}

            <div className="field" style={{ marginBlockStart: "1.2rem" }}>
              <label htmlFor="notes">{t("notes")}</label>
              <textarea
                id="notes"
                name="notes"
                className="textarea"
                placeholder={t("notesPlaceholder")}
              />
            </div>
          </section>
        </div>

        <aside className="checkout-summary">
          <h2>{t("summary")}</h2>
          <div className="summary-items">
            {items.map((item) => (
              <div className="summary-item" key={item.variantId}>
                <div className="summary-item-media">
                  <Image
                    src={item.imageUrl}
                    alt={locale === "ar" ? item.nameAr : item.nameEn}
                    fill
                    sizes="54px"
                  />
                </div>
                <div>
                  <p className="summary-item-name">
                    {locale === "ar" ? item.nameAr : item.nameEn}
                  </p>
                  <p className="summary-item-meta">
                    {locale === "ar" ? item.variantNameAr : item.variantNameEn}{" "}
                    × {item.quantity}
                  </p>
                </div>
                <span className="summary-item-price">
                  {formatMoney(item.unitPrice * item.quantity, locale)}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-row">
            <span>{common("subtotal")}</span>
            <span>{formatMoney(subtotal, locale)}</span>
          </div>

          <div className="discount-form">
            <input
              value={discount}
              onChange={(event) => {
                setDiscount(event.target.value.toUpperCase());
                setDiscountResult(null);
              }}
              placeholder={t("discount")}
              aria-label={t("discount")}
            />
            <button
              type="button"
              className="button button-small"
              onClick={applyDiscount}
              disabled={checkingDiscount || !discount.trim()}
            >
              {checkingDiscount ? <Loader2 size={13} /> : t("discountApply")}
            </button>
          </div>
          {discountResult ? (
            discountResult.ok ? (
              <p className="discount-message">
                {t("discountApplied")} · −
                {formatMoney(discountResult.amount, locale)}
              </p>
            ) : (
              <p className="discount-message" data-error="true">
                {discountResult.reason === "minimum"
                  ? t("discountMinimum")
                  : t("discountInvalid")}
              </p>
            )
          ) : null}

          {discountAmount > 0 ? (
            <div className="summary-row">
              <span>{t("discount")}</span>
              <span>−{formatMoney(discountAmount, locale)}</span>
            </div>
          ) : null}

          <div className="summary-row">
            <span>{t("delivery")}</span>
            <span>
              {computedDelivery === 0
                ? common("free")
                : formatMoney(computedDelivery, locale)}
            </span>
          </div>
          <div className="summary-row summary-total">
            <span>{common("total")}</span>
            <span>{formatMoney(total, locale)}</span>
          </div>

          {errorKey ? (
            <p className="form-error" style={{ marginBlockStart: "0.8rem" }}>
              {errorKey === "required"
                ? t("required")
                : errorKey === "discount"
                  ? t("discountInvalid")
                  : errorKey === "stock"
                    ? t("stockError")
                    : t("error")}
            </p>
          ) : null}

          <button
            type="submit"
            className="button button-block"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 size={15} className="spin" />
                {t("placing")}
              </>
            ) : (
              t("placeOrder")
            )}
          </button>
          <p className="form-note">
            <ShieldCheck
              size={13}
              style={{ display: "inline", marginInlineEnd: 4 }}
            />
            {t("terms")}
          </p>
          <p className="form-note">
            {`${count} ${count === 1 ? cartT("item") : cartT("items")} · ${t("secure")}`}
          </p>
        </aside>
      </div>
    </form>
  );
}
