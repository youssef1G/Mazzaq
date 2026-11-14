import { desc, eq, sql } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDb } from "@/db";
import { addresses, orders } from "@/db/schema";
import { Link } from "@/i18n/navigation";
import { formatDate, formatMoney } from "@/lib/money";
import { orderStatusKey, orderStatusTone } from "@/lib/order-status";
import { requireUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("accountTitle") };
}

export default async function AccountOverviewPage({
  params,
}: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, t, orderT] = await Promise.all([
    requireUser(locale),
    getTranslations("Account"),
    getTranslations("Order"),
  ]);

  const db = await getDb();
  const [totals, addressCount, recent] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
        spent: sql<number>`coalesce(sum(case when ${orders.status} <> 'cancelled' then ${orders.total} else 0 end), 0)::int`,
      })
      .from(orders)
      .where(eq(orders.userId, session.user.id)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(addresses)
      .where(eq(addresses.userId, session.user.id)),
    db.query.orders.findMany({
      where: eq(orders.userId, session.user.id),
      orderBy: [desc(orders.createdAt)],
      limit: 5,
      columns: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        total: true,
      },
    }),
  ]);

  const stats = totals[0] ?? { count: 0, spent: 0 };
  const addressTotal = addressCount[0]?.count ?? 0;
  const firstName = session.user.name.split(" ")[0] || session.user.name;

  return (
    <div>
      <header className="account-head">
        <div>
          <h1>{t("greeting", { name: firstName })}</h1>
          <p>{t("greetingLead")}</p>
        </div>
        <p>
          {t("memberSince", {
            date: formatDate(session.user.createdAt, locale),
          })}
        </p>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <span>{t("statsOrders")}</span>
          <strong>
            {stats.count.toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}
          </strong>
        </div>
        <div className="stat">
          <span>{t("statsSpent")}</span>
          <strong>{formatMoney(stats.spent, locale)}</strong>
        </div>
        <div className="stat">
          <span>{t("statsAddresses")}</span>
          <strong>
            {addressTotal.toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}
          </strong>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{t("recentOrders")}</h2>
          {recent.length > 0 ? (
            <Link href="/account/orders" className="text-link">
              {t("orders")}
              <ArrowRight size={12} strokeWidth={1.6} aria-hidden />
            </Link>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem 1rem" }}>
            <span className="empty-mark" aria-hidden>
              ✳
            </span>
            <h3>{t("noOrders")}</h3>
            <p>{t("noOrdersLead")}</p>
            <Link
              href="/shop"
              className="button"
              style={{ marginBlockStart: "1rem" }}
            >
              {t("startOrder")}
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("orderNumber")}</th>
                  <th>{t("date")}</th>
                  <th>{t("status")}</th>
                  <th>{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/order/${order.orderNumber}`}>
                        {order.orderNumber}
                      </Link>
                    </td>
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
                    <td className="num">{formatMoney(order.total, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
