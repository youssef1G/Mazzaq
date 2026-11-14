import { desc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  type CustomerRow,
  CustomerTable,
} from "@/components/admin/customer-table";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { formatMoney } from "@/lib/money";

export default async function AdminCustomersPage({
  params,
}: PageProps<"/[locale]/admin/customers">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t] = await Promise.all([getTranslations("Admin")]);

  const db = await getDb();
  const [users, orderRows] = await Promise.all([
    db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    }),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(2000),
  ]);

  const rows = new Map<string, CustomerRow>();
  const registeredByEmail = new Map<string, string>();

  for (const account of users) {
    rows.set(account.id, {
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone,
      role: account.role ?? "user",
      kind: "registered",
      joinedAt: account.createdAt.toISOString(),
      orderCount: 0,
      spend: 0,
      lastOrderAt: null,
      lastOrderNumber: null,
      lastOrderStatus: null,
      recentOrders: [],
    });
    if (account.email) {
      registeredByEmail.set(account.email.toLowerCase(), account.id);
    }
  }

  for (const order of orderRows) {
    // A guest checkout that matches a registered email belongs to that
    // customer, so the list never shows the same person twice.
    const registeredId =
      order.userId ??
      (order.customerEmail
        ? registeredByEmail.get(order.customerEmail.toLowerCase())
        : undefined);

    let row = registeredId ? rows.get(registeredId) : undefined;

    if (!row) {
      const key = order.customerEmail.toLowerCase();
      row = rows.get(`guest:${key}`);
      if (!row) {
        row = {
          id: `guest:${key}`,
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          role: "guest",
          kind: "guest",
          joinedAt: order.createdAt.toISOString(),
          orderCount: 0,
          spend: 0,
          lastOrderAt: null,
          lastOrderNumber: null,
          lastOrderStatus: null,
          recentOrders: [],
        };
        rows.set(row.id, row);
      }
    }

    row.orderCount += 1;
    if (order.status !== "cancelled") row.spend += order.total;
    if (!row.lastOrderAt) {
      row.lastOrderAt = order.createdAt.toISOString();
      row.lastOrderNumber = order.orderNumber;
      row.lastOrderStatus = order.status;
    }
    if (row.recentOrders.length < 5) {
      row.recentOrders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toISOString(),
        status: order.status,
        paymentMethod: order.paymentMethod,
        total: order.total,
      });
    }
  }

  const all = [...rows.values()].sort(
    (a, b) => b.spend - a.spend || b.orderCount - a.orderCount,
  );

  const registeredCount = users.length;
  const guestCount = all.filter((row) => row.kind === "guest").length;
  const repeatCount = all.filter((row) => row.orderCount >= 2).length;
  const totalSpend = all.reduce((sum, row) => sum + row.spend, 0);

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("customersTitle")}</h1>
        <div className="admin-topbar-actions">
          <span>{all.length}</span>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-metrics">
          <div className="admin-metric">
            <span>{t("customersTitle")}</span>
            <strong>{registeredCount}</strong>
          </div>
          <div className="admin-metric">
            <span>{t("guestCustomers")}</span>
            <strong>{guestCount}</strong>
          </div>
          <div className="admin-metric">
            <span>{t("repeatCustomers")}</span>
            <strong>{repeatCount}</strong>
          </div>
          <div className="admin-metric">
            <span>{t("totalSpend")}</span>
            <strong>{formatMoney(totalSpend, locale)}</strong>
          </div>
        </div>

        <section className="admin-card">
          <CustomerTable rows={all} />
        </section>
      </div>
    </>
  );
}
