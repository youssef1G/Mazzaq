import { desc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { Link } from "@/i18n/navigation";
import { formatDate, formatMoney } from "@/lib/money";
import {
  orderStatusKey,
  orderStatusTone,
  paymentStatusKey,
  paymentStatusTone,
} from "@/lib/order-status";
import { requireUser } from "@/lib/session";

export default async function AccountOrdersPage({
  params,
}: PageProps<"/[locale]/account/orders">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, t, orderT] = await Promise.all([
    requireUser(locale),
    getTranslations("Account"),
    getTranslations("Order"),
  ]);

  const db = await getDb();
  const rows = await db.query.orders.findMany({
    where: eq(orders.userId, session.user.id),
    orderBy: [desc(orders.createdAt)],
    limit: 100,
    columns: {
      id: true,
      orderNumber: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      total: true,
    },
  });

  return (
    <div>
      <header className="account-head">
        <div>
          <h1>{t("orders")}</h1>
          <p>{t("lead")}</p>
        </div>
        <p>{t("items", { count: rows.length })}</p>
      </header>

      {rows.length === 0 ? (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden>
            ✳
          </span>
          <h2>{t("noOrders")}</h2>
          <p>{t("noOrdersLead")}</p>
          <Link href="/shop" className="button">
            {t("startOrder")}
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("orderNumber")}</th>
                  <th>{t("date")}</th>
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
                    <td>
                      <span
                        className="badge"
                        data-tone={paymentStatusTone(order.paymentStatus)}
                      >
                        {orderT(paymentStatusKey(order.paymentStatus))}
                      </span>
                    </td>
                    <td className="num">{formatMoney(order.total, locale)}</td>
                    <td>
                      <Link href={`/order/${order.orderNumber}`}>
                        {t("viewOrder")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
