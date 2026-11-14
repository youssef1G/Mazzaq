import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InlineOrderStatus } from "@/components/admin/inline-order-status";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { getDb } from "@/db";
import type { OrderStatus, PaymentStatus } from "@/db/schema";
import { orders } from "@/db/schema";
import { Link } from "@/i18n/navigation";
import { formatDateTime, formatMoney } from "@/lib/money";
import {
  normalizeOrderStatus,
  orderStatuses,
  orderStatusKey,
  paymentStatuses,
  paymentStatusKey,
  paymentStatusTone,
} from "@/lib/order-status";

export default async function AdminOrdersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/orders">) {
  const [{ locale }, query, t, orderT] = await Promise.all([
    params,
    searchParams,
    getTranslations("Admin"),
    getTranslations("Order"),
  ]);
  setRequestLocale(locale);

  const term = String(query.q ?? "").trim();
  const status = String(query.status ?? "").trim();
  const payment = String(query.payment ?? "").trim();

  const conditions: SQL[] = [];
  if (term) {
    const pattern = `%${term}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, pattern),
        ilike(orders.customerName, pattern),
        ilike(orders.customerEmail, pattern),
        ilike(orders.customerPhone, pattern),
      ) as SQL,
    );
  }
  if (status && orderStatuses.includes(status as OrderStatus)) {
    conditions.push(eq(orders.status, status as OrderStatus));
  }
  if (payment && paymentStatuses.includes(payment as PaymentStatus)) {
    conditions.push(eq(orders.paymentStatus, payment as PaymentStatus));
  }

  const db = await getDb();
  const rows = await db.query.orders.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(orders.createdAt)],
    limit: 200,
    columns: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      total: true,
      fulfillmentType: true,
    },
    with: { items: { columns: { quantity: true } } },
  });

  const returnParams = new URLSearchParams();
  if (term) returnParams.set("q", term);
  if (status) returnParams.set("status", status);
  if (payment) returnParams.set("payment", payment);
  const queryString = returnParams.toString();
  const returnTo = `/${locale}/admin/orders${queryString ? `?${queryString}` : ""}`;

  const statusOptions = [
    { value: "", label: t("allStatuses") },
    ...orderStatuses.map((value) => ({
      value,
      label: orderT(orderStatusKey(value)),
    })),
  ];
  const paymentOptions = [
    { value: "", label: t("allPayments") },
    ...paymentStatuses.map((value) => ({
      value,
      label: orderT(paymentStatusKey(value)),
    })),
  ];

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("ordersTitle")}</h1>
        <div className="admin-topbar-actions">
          <span>{rows.length}</span>
        </div>
      </header>

      <div className="admin-content">
        <form method="get" className="admin-toolbar">
          <input
            type="search"
            name="q"
            className="input"
            placeholder={t("search")}
            defaultValue={term}
          />
          <DropdownSelect
            name="status"
            compact
            submitOnChange
            defaultValue={status}
            label={t("filterStatus")}
            options={statusOptions}
          />
          <DropdownSelect
            name="payment"
            compact
            submitOnChange
            defaultValue={payment}
            label={t("filterPayment")}
            options={paymentOptions}
          />
          <button type="submit" className="button button-small">
            {t("searchButton")}
          </button>
        </form>

        <section className="admin-card">
          {rows.length === 0 ? (
            <p className="muted small">{t("noData")}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("orderNumber")}</th>
                    <th>{t("customer")}</th>
                    <th>{t("placed")}</th>
                    <th>{t("status")}</th>
                    <th>{t("payment")}</th>
                    <th>{t("total")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/admin/orders/${order.id}`}>
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td>
                        {order.customerName}
                        <br />
                        <span className="muted small">
                          {order.customerEmail}
                        </span>
                      </td>
                      <td className="num">
                        {formatDateTime(order.createdAt, locale)}
                      </td>
                      <td>
                        <InlineOrderStatus
                          orderId={order.id}
                          locale={locale}
                          status={normalizeOrderStatus(order.status)}
                          returnTo={returnTo}
                        />
                      </td>
                      <td>
                        <span
                          className="badge"
                          data-tone={paymentStatusTone(order.paymentStatus)}
                        >
                          {order.paymentMethod === "cod"
                            ? orderT("paymentCod")
                            : orderT("paymentInstapay")}
                          {" · "}
                          {orderT(paymentStatusKey(order.paymentStatus))}
                        </span>
                      </td>
                      <td className="num">
                        {formatMoney(order.total, locale)}
                      </td>
                      <td>
                        <Link href={`/admin/orders/${order.id}`}>
                          {t("view")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
