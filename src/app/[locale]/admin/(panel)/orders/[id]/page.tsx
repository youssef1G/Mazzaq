import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { updateOrder } from "@/actions/admin";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { Link } from "@/i18n/navigation";
import { formatDateTime, formatMoney, formatSlotDate } from "@/lib/money";
import {
  normalizeOrderStatus,
  normalizePaymentStatus,
  orderStatuses,
  orderStatusKey,
  orderStatusTone,
  paymentStatuses,
  paymentStatusKey,
} from "@/lib/order-status";
import { getDeliverySettings } from "@/lib/settings";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/orders/[id]">) {
  const [{ locale, id }, query, t, orderT] = await Promise.all([
    params,
    searchParams,
    getTranslations("Admin"),
    getTranslations("Order"),
  ]);
  setRequestLocale(locale);

  const [db, deliverySettings] = await Promise.all([
    getDb(),
    getDeliverySettings(),
  ]);
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
      events: true,
      receipt: true,
    },
  });
  if (!order) notFound();

  const events = [...order.events].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  function windowLabel(value: string | null) {
    if (!value) return t("deliveryWindowNone");
    const window = deliverySettings.deliveryWindows.find(
      (item) =>
        item.key === value || item.labelEn === value || item.labelAr === value,
    );
    return window ? (locale === "ar" ? window.labelAr : window.labelEn) : value;
  }

  const savedWindowKey =
    deliverySettings.deliveryWindows.find(
      (window) =>
        window.key === order.deliveryWindow ||
        window.labelEn === order.deliveryWindow,
    )?.key ?? "";

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("orderTitle", { number: order.orderNumber })}</h1>
        <div className="admin-topbar-actions">
          <Link href="/admin/orders" className="text-link">
            {t("navOrders")}
          </Link>
        </div>
      </header>

      <div className="admin-content">
        {query.saved ? <p className="form-success">{t("orderSaved")}</p> : null}
        {query.error === "date" ? (
          <p className="form-error">{t("errorDate")}</p>
        ) : null}
        {query.error === "window" ? (
          <p className="form-error">{t("errorWindow")}</p>
        ) : null}
        {query.error && query.error !== "date" && query.error !== "window" ? (
          <p className="form-error">{t("errorRequired")}</p>
        ) : null}

        <div className="admin-grid">
          <div>
            <section className="admin-card">
              <div className="admin-card-head">
                <h2>{orderT("summary")}</h2>
                <span
                  className="badge"
                  data-tone={orderStatusTone(order.status)}
                >
                  {orderT(orderStatusKey(order.status))}
                </span>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{orderT("summary")}</th>
                      <th>{orderT("delivery")}</th>
                      <th>{orderT("total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {locale === "ar"
                            ? item.productNameAr
                            : item.productNameEn}
                          <br />
                          <span className="muted small">
                            {locale === "ar"
                              ? item.variantNameAr
                              : item.variantNameEn}{" "}
                            × {item.quantity}
                          </span>
                        </td>
                        <td className="num">
                          {formatMoney(item.unitPrice, locale)}
                        </td>
                        <td className="num">
                          {formatMoney(item.lineTotal, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                className="summary-list"
                style={{ marginBlockStart: "1rem" }}
              >
                <div className="summary-row">
                  <span>{orderT("subtotal")}</span>
                  <span>{formatMoney(order.subtotal, locale)}</span>
                </div>
                {order.discountTotal > 0 ? (
                  <div className="summary-row">
                    <span>
                      {orderT("discount")} {order.discountCode}
                    </span>
                    <span>−{formatMoney(order.discountTotal, locale)}</span>
                  </div>
                ) : null}
                <div className="summary-row">
                  <span>{orderT("deliveryFee")}</span>
                  <span>{formatMoney(order.deliveryFee, locale)}</span>
                </div>
                <div className="summary-row summary-total">
                  <span>{orderT("total")}</span>
                  <span>{formatMoney(order.total, locale)}</span>
                </div>
              </div>
            </section>

            <section className="admin-card">
              <div className="admin-card-head">
                <h2>{t("eventTimeline")}</h2>
              </div>
              {events.length === 0 ? (
                <p className="muted small">{t("noData")}</p>
              ) : (
                <div className="timeline">
                  {events.map((event) => (
                    <div className="timeline-item" key={event.id}>
                      <strong>{event.message}</strong>
                      <span>{formatDateTime(event.createdAt, locale)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div>
            <section className="admin-card">
              <div className="admin-card-head">
                <h2>{t("updateStatus")}</h2>
              </div>
              <form action={updateOrder} className="admin-form">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="orderId" value={order.id} />
                <p className="admin-form-label">{t("deliverySchedule")}</p>
                <div className="field">
                  <label htmlFor="deliveryDate">{t("deliveryDate")}</label>
                  <input
                    id="deliveryDate"
                    name="deliveryDate"
                    type="date"
                    className="input"
                    defaultValue={order.deliveryDate ?? ""}
                  />
                </div>
                <div className="field">
                  <label htmlFor="deliveryWindow">{t("deliveryWindow")}</label>
                  <DropdownSelect
                    id="deliveryWindow"
                    name="deliveryWindow"
                    label={t("deliveryWindow")}
                    defaultValue={savedWindowKey}
                    options={[
                      { value: "", label: t("deliveryWindowNone") },
                      ...deliverySettings.deliveryWindows.map((window) => ({
                        value: window.key,
                        label:
                          locale === "ar" ? window.labelAr : window.labelEn,
                      })),
                    ]}
                  />
                </div>
                <p className="admin-form-label">{t("updateStatus")}</p>
                <div className="field">
                  <label htmlFor="status">{t("status")}</label>
                  <DropdownSelect
                    id="status"
                    name="status"
                    label={t("status")}
                    defaultValue={normalizeOrderStatus(order.status)}
                    options={orderStatuses.map((value) => ({
                      value,
                      label: orderT(orderStatusKey(value)),
                    }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="paymentStatus">{t("payment")}</label>
                  <DropdownSelect
                    id="paymentStatus"
                    name="paymentStatus"
                    label={t("payment")}
                    defaultValue={normalizePaymentStatus(order.paymentStatus)}
                    options={paymentStatuses.map((value) => ({
                      value,
                      label: orderT(paymentStatusKey(value)),
                    }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="adminNotes">{t("adminNotes")}</label>
                  <textarea
                    id="adminNotes"
                    name="adminNotes"
                    className="textarea"
                    defaultValue={order.adminNotes ?? ""}
                    placeholder={t("adminNotesPlaceholder")}
                  />
                </div>
                <div>
                  <button type="submit" className="button">
                    {t("save")}
                  </button>
                </div>
              </form>
            </section>

            <section className="admin-card">
              <div className="admin-card-head">
                <h2>{t("customerInfo")}</h2>
              </div>
              <dl className="info-list">
                <div>
                  <dt>{t("customer")}</dt>
                  <dd>{order.customerName}</dd>
                </div>
                <div>
                  <dt>{t("payment")}</dt>
                  <dd>{order.customerEmail}</dd>
                </div>
                <div>
                  <dt>{t("phone")}</dt>
                  <dd>{order.customerPhone}</dd>
                </div>
                <div>
                  <dt>{t("deliveryInfo")}</dt>
                  <dd>{orderT("delivery")}</dd>
                </div>
                <div>
                  <dt>{orderT("estimated")}</dt>
                  <dd>
                    {order.deliveryDate
                      ? `${formatSlotDate(order.deliveryDate, locale)} · ${windowLabel(
                          order.deliveryWindow,
                        )}`
                      : orderT("estimatedPending")}
                  </dd>
                </div>
                {order.addressLine1 ? (
                  <div>
                    <dt>{orderT("delivery")}</dt>
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
                ) : null}
                {order.notes ? (
                  <div>
                    <dt>{orderT("notes")}</dt>
                    <dd>{order.notes}</dd>
                  </div>
                ) : null}
                {order.discountCode ? (
                  <div>
                    <dt>{orderT("discount")}</dt>
                    <dd>{order.discountCode}</dd>
                  </div>
                ) : null}
                {order.paymentReference ? (
                  <div>
                    <dt>{orderT("referenceLabel")}</dt>
                    <dd>{order.paymentReference}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="admin-card">
              <div className="admin-card-head">
                <h2>{t("receipt")}</h2>
              </div>
              {order.receipt ? (
                <>
                  {order.receipt.mimeType.startsWith("image/") ? (
                    // biome-ignore lint/performance/noImgElement: receipts are streamed from an API route
                    <img
                      src={`/api/receipts/${order.id}`}
                      alt={t("receipt")}
                      className="receipt-preview"
                    />
                  ) : null}
                  <p
                    className="muted small"
                    style={{ marginBlockStart: "0.6rem" }}
                  >
                    {order.receipt.fileName} ·{" "}
                    <a
                      href={`/api/receipts/${order.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-link"
                    >
                      {t("viewEmail")}
                    </a>
                  </p>
                </>
              ) : (
                <p className="muted small">{t("noReceipt")}</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
