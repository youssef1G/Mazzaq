import { eq } from "drizzle-orm";
import { CheckCircle2, Clock3, MapPin, ReceiptText } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClearCart } from "@/components/cart/clear-cart";
import { ReceiptUpload } from "@/components/order/receipt-upload";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { Link } from "@/i18n/navigation";
import { getLocale } from "@/lib/locale";
import { formatDateTime, formatMoney, formatSlotDate } from "@/lib/money";
import { hasOrderAccess } from "@/lib/order-access";
import {
  normalizeOrderStatus,
  normalizePaymentStatus,
  orderStatusKey,
  orderStatusTone,
  paymentStatusKey,
  paymentStatusTone,
} from "@/lib/order-status";
import { getSession } from "@/lib/session";
import { getDeliverySettings, getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OrderPage({
  params,
}: PageProps<"/[locale]/order/[number]">) {
  const [{ locale, number }, t, localeValue, store, session, deliverySettings] =
    await Promise.all([
      params,
      getTranslations("Order"),
      getLocale(),
      getStoreSettings(),
      getSession(),
      getDeliverySettings(),
    ]);
  setRequestLocale(locale);

  const db = await getDb();
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, number),
    with: {
      items: {
        with: {
          product: { with: { images: true } },
        },
      },
      events: true,
      receipt: { columns: { id: true, fileName: true } },
    },
  });

  if (!order) notFound();

  const ownsOrder =
    (session?.user?.id && order.userId === session.user.id) ||
    (await hasOrderAccess(order.id));
  if (!ownsOrder) notFound();

  const normalizedStatus = normalizeOrderStatus(order.status);
  const normalizedPayment = normalizePaymentStatus(order.paymentStatus);
  const canUploadReceipt =
    order.paymentMethod === "instapay" &&
    normalizedPayment === "unpaid" &&
    normalizedStatus !== "completed" &&
    normalizedStatus !== "cancelled";
  const showInstapayPanel =
    order.paymentMethod === "instapay" && normalizedPayment === "unpaid";

  const scheduledWindow = order.deliveryWindow
    ? deliverySettings.deliveryWindows.find(
        (window) =>
          window.key === order.deliveryWindow ||
          window.labelEn === order.deliveryWindow ||
          window.labelAr === order.deliveryWindow,
      )
    : null;
  const windowLabel = scheduledWindow
    ? localeValue === "ar"
      ? scheduledWindow.labelAr
      : scheduledWindow.labelEn
    : order.deliveryWindow;
  const when = order.deliveryDate
    ? `${formatSlotDate(order.deliveryDate, localeValue)}${windowLabel ? ` · ${windowLabel}` : ""}`
    : t("estimatedPending");

  const events = [...order.events].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return (
    <>
      <ClearCart />
      <section className="order-status-hero">
        <div className="shell">
          <span className="eyebrow">{t("confirmedTitle")}</span>
          <h1>{t("thankYou")}</h1>
          <p>
            {t("confirmedLead", {
              name: order.customerName.split(" ")[0] ?? order.customerName,
              email: order.customerEmail,
            })}
          </p>
          <div className="order-meta-row">
            <span>
              {t("number")} {order.orderNumber}
            </span>
            <span>
              {t("placed")} {formatDateTime(order.createdAt, localeValue)}
            </span>
            <span className="badge" data-tone={orderStatusTone(order.status)}>
              {t(orderStatusKey(order.status))}
            </span>
          </div>
        </div>
      </section>

      <div className="shell order-layout">
        <div>
          <section className="order-block">
            <h2>{t("summary")}</h2>
            <div className="order-items">
              {order.items.map((item) => {
                const images = item.product?.images ?? [];
                const image =
                  [...images].sort((a, b) => {
                    if (a.isPrimary !== b.isPrimary)
                      return a.isPrimary ? -1 : 1;
                    return a.sortOrder - b.sortOrder;
                  })[0]?.url ?? "/images/placeholder.svg";
                return (
                  <div className="order-item" key={item.id}>
                    <div className="order-item-media">
                      <Image src={image} alt="" fill sizes="64px" />
                    </div>
                    <div>
                      <p className="order-item-name">
                        {localeValue === "ar"
                          ? item.productNameAr
                          : item.productNameEn}
                      </p>
                      <p className="order-item-meta">
                        {localeValue === "ar"
                          ? item.variantNameAr
                          : item.variantNameEn}{" "}
                        × {item.quantity}
                      </p>
                    </div>
                    <span className="order-item-price">
                      {formatMoney(item.lineTotal, localeValue)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="summary-list" style={{ marginBlockStart: "1rem" }}>
              <div className="summary-row">
                <span>{t("subtotal")}</span>
                <span>{formatMoney(order.subtotal, localeValue)}</span>
              </div>
              {order.discountTotal > 0 ? (
                <div className="summary-row">
                  <span>
                    {t("discount")} {order.discountCode}
                  </span>
                  <span>−{formatMoney(order.discountTotal, localeValue)}</span>
                </div>
              ) : null}
              <div className="summary-row">
                <span>{t("deliveryFee")}</span>
                <span>{formatMoney(order.deliveryFee, localeValue)}</span>
              </div>
              <div className="summary-row summary-total">
                <span>{t("total")}</span>
                <span>{formatMoney(order.total, localeValue)}</span>
              </div>
            </div>
          </section>

          <section className="order-block">
            <h2>{t("timeline")}</h2>
            <div className="timeline">
              {events.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <strong>{event.message}</strong>
                  <span>{formatDateTime(event.createdAt, localeValue)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside>
          <div className="order-panel">
            <h2 className="order-block" style={{ marginBlockEnd: "1rem" }}>
              {t("delivery")}
            </h2>
            <dl className="info-list">
              <div>
                <dt>
                  <MapPin size={13} /> {t("delivery")}
                </dt>
                <dd>{when}</dd>
              </div>
              <div>
                <dt>{t("delivery")}</dt>
                <dd>
                  {[
                    order.addressLine1,
                    order.addressLine2,
                    order.area,
                    order.city,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
              <div>
                <dt>
                  <Clock3 size={13} /> {t("status")}
                </dt>
                <dd>{t(orderStatusKey(order.status))}</dd>
              </div>
              {order.notes ? (
                <div>
                  <dt>{t("notes")}</dt>
                  <dd>{order.notes}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="order-panel">
            <h2
              style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem" }}
            >
              {t("payment")}
            </h2>
            <dl className="info-list" style={{ marginBlockStart: "0.8rem" }}>
              <div>
                <dt>{t("payment")}</dt>
                <dd>
                  {order.paymentMethod === "cod"
                    ? t("paymentCod")
                    : t("paymentInstapay")}
                </dd>
              </div>
              <div>
                <dt>{t("paymentStatus")}</dt>
                <dd>
                  <span
                    className="badge"
                    data-tone={paymentStatusTone(order.paymentStatus)}
                  >
                    {t(paymentStatusKey(order.paymentStatus))}
                  </span>
                </dd>
              </div>
              {order.paymentReference ? (
                <div>
                  <dt>{t("referenceLabel")}</dt>
                  <dd>{order.paymentReference}</dd>
                </div>
              ) : null}
            </dl>

            {showInstapayPanel ? (
              <div className="payment-panel">
                <p className="form-note">{t("instapayLead")}</p>
                <div
                  className="instapay-handle"
                  style={{ marginBlock: "0.8rem" }}
                >
                  <code>{store.instapayHandle}</code>
                  <strong>{formatMoney(order.total, localeValue)}</strong>
                </div>
                {order.receipt ? (
                  <p className="form-note">
                    <ReceiptText size={13} style={{ display: "inline" }} />{" "}
                    {t("receiptUploaded")} ·{" "}
                    <a
                      href={`/api/receipts/${order.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-link"
                    >
                      {t("viewReceipt")}
                    </a>
                  </p>
                ) : null}
                {canUploadReceipt ? (
                  <ReceiptUpload orderId={order.id} />
                ) : (
                  <p className="form-note">{t("receiptClosed")}</p>
                )}
              </div>
            ) : null}

            {order.paymentMethod === "cod" && normalizedPayment === "unpaid" ? (
              <p className="form-note" style={{ marginBlockStart: "0.8rem" }}>
                <CheckCircle2 size={13} style={{ display: "inline" }} />{" "}
                {t("paymentCod")}
              </p>
            ) : null}
          </div>

          <div className="order-panel">
            <p className="form-note">{t("contact")}</p>
            <Link href="/contact" className="text-link">
              {t("contactLink")}
            </Link>
          </div>

          <p style={{ marginBlockStart: "1.2rem" }}>
            <Link href="/shop" className="text-link">
              {t("backHome")}
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
