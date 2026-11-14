import { startOfDay, startOfMonth } from "date-fns";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDb } from "@/db";
import { orders, productVariants } from "@/db/schema";
import { Link } from "@/i18n/navigation";
import { formatDate, formatMoney } from "@/lib/money";
import { orderStatusKey, orderStatusTone } from "@/lib/order-status";

export default async function AdminDashboardPage({
  params,
}: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, orderT] = await Promise.all([
    getTranslations("Admin"),
    getTranslations("Order"),
  ]);

  const db = await getDb();
  const now = new Date();

  const [monthStats, todayStats, attentionCount, recent, lowStock, receipts] =
    await Promise.all([
      db
        .select({
          count: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(case when ${orders.status} <> 'cancelled' then ${orders.total} else 0 end), 0)::int`,
        })
        .from(orders)
        .where(gte(orders.createdAt, startOfMonth(now))),
      db
        .select({
          count: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(case when ${orders.status} <> 'cancelled' then ${orders.total} else 0 end), 0)::int`,
        })
        .from(orders)
        .where(gte(orders.createdAt, startOfDay(now))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(eq(orders.status, "confirmed")),
      db.query.orders.findMany({
        orderBy: [desc(orders.createdAt)],
        limit: 8,
        columns: {
          id: true,
          orderNumber: true,
          customerName: true,
          createdAt: true,
          status: true,
          total: true,
        },
      }),
      db.query.productVariants.findMany({
        where: and(
          eq(productVariants.trackInventory, true),
          eq(productVariants.isActive, true),
          lte(productVariants.stock, 6),
        ),
        with: { product: { columns: { nameEn: true, nameAr: true } } },
        orderBy: [asc(productVariants.stock)],
        limit: 8,
        columns: { id: true, nameEn: true, nameAr: true, stock: true },
      }),
      db.query.orders
        .findMany({
          where: and(
            eq(orders.paymentMethod, "instapay"),
            eq(orders.paymentStatus, "unpaid"),
          ),
          with: { receipt: { columns: { id: true } } },
          orderBy: [asc(orders.createdAt)],
          limit: 20,
          columns: {
            id: true,
            orderNumber: true,
            customerName: true,
            total: true,
            createdAt: true,
          },
        })
        .then((rows) => rows.filter((order) => order.receipt).slice(0, 6)),
    ]);

  const month = monthStats[0] ?? { count: 0, revenue: 0 };
  const today = todayStats[0] ?? { count: 0, revenue: 0 };
  const average = month.count > 0 ? Math.round(month.revenue / month.count) : 0;

  const quickActions = [
    { href: "/admin/products/new", label: t("newProduct") },
    { href: "/admin/categories/new", label: t("newCategory") },
    { href: "/admin/orders", label: t("viewOrders") },
    { href: "/", label: t("viewStore") },
  ];

  return (
    <>
      <header className="admin-topbar">
        <div>
          <h1>{t("dashboardTitle")}</h1>
          <p className="admin-topbar-date">
            {formatDate(now, locale, { dateStyle: "full" })}
          </p>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-metrics">
          <div className="admin-metric">
            <span>{t("revenueToday")}</span>
            <strong>{formatMoney(today.revenue, locale)}</strong>
            <small>
              {today.count} {t("navOrders").toLowerCase()}
            </small>
          </div>
          <div className="admin-metric">
            <span>{t("revenue")}</span>
            <strong>{formatMoney(month.revenue, locale)}</strong>
            <small>
              {month.count} {t("navOrders").toLowerCase()}
            </small>
          </div>
          <div className="admin-metric">
            <span>{t("pending")}</span>
            <strong>{attentionCount[0]?.count ?? 0}</strong>
            <small>{t("pendingHint")}</small>
          </div>
          <div className="admin-metric">
            <span>{t("avgOrder")}</span>
            <strong>{formatMoney(average, locale)}</strong>
            <small>{t("thisMonth")}</small>
          </div>
        </div>

        <div className="admin-quick-actions">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="admin-quick-action"
            >
              {action.label}
              <ArrowUpRight size={14} strokeWidth={1.6} aria-hidden />
            </Link>
          ))}
        </div>

        <div className="admin-grid">
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>{t("recentOrders")}</h2>
              <Link href="/admin/orders">{t("viewAll")}</Link>
            </div>
            {recent.length === 0 ? (
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
                      <th>{t("total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <Link href={`/admin/orders/${order.id}`}>
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td>{order.customerName}</td>
                        <td className="num">
                          {formatDate(order.createdAt, locale)}
                        </td>
                        <td>
                          <span
                            className="badge"
                            data-tone={orderStatusTone(order.status)}
                          >
                            {orderT(orderStatusKey(order.status))}
                          </span>
                        </td>
                        <td className="num">
                          {formatMoney(order.total, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div>
            <section className="admin-card">
              <div className="admin-card-head">
                <h2>{t("pendingReceipts")}</h2>
              </div>
              {receipts.length === 0 ? (
                <p className="muted small">{t("noData")}</p>
              ) : (
                <ul className="admin-list">
                  {receipts.map((order) => (
                    <li key={order.id}>
                      <Link href={`/admin/orders/${order.id}`}>
                        {order.orderNumber}
                      </Link>
                      <span className="muted small">
                        {order.customerName} ·{" "}
                        {formatMoney(order.total, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-card">
              <div className="admin-card-head">
                <h2>{t("lowStock")}</h2>
                <Link href="/admin/products">{t("viewAll")}</Link>
              </div>
              {lowStock.length === 0 ? (
                <p className="muted small">{t("noData")}</p>
              ) : (
                <ul className="admin-list">
                  {lowStock.map((variant) => (
                    <li key={variant.id}>
                      <span>
                        {locale === "ar"
                          ? variant.product?.nameAr
                          : variant.product?.nameEn}
                        {" — "}
                        {locale === "ar" ? variant.nameAr : variant.nameEn}
                      </span>
                      <span className="badge" data-tone="amber">
                        {variant.stock}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
