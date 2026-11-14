"use client";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { formatDate, formatMoney } from "@/lib/money";
import { orderStatusKey, orderStatusTone } from "@/lib/order-status";

export type CustomerRecentOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  total: number;
};

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  kind: "registered" | "guest";
  joinedAt: string;
  orderCount: number;
  spend: number;
  lastOrderAt: string | null;
  lastOrderNumber: string | null;
  lastOrderStatus: string | null;
  recentOrders: CustomerRecentOrder[];
};

export function CustomerTable({ rows }: { rows: CustomerRow[] }) {
  const t = useTranslations("Admin");
  const orderT = useTranslations("Order");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.name, row.email, row.phone ?? ""].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [query, rows]);

  return (
    <>
      <div className="admin-toolbar">
        <input
          type="search"
          name="q"
          className="input"
          placeholder={t("searchCustomers")}
          aria-label={t("searchCustomers")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="muted small">{t("noData")}</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("customer")}</th>
                <th>{t("type")}</th>
                <th>{t("joined")}</th>
                <th>{t("orderCount")}</th>
                <th>{t("lastOrder")}</th>
                <th>{t("spend")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isOpen = expanded === row.id;
                return [
                  <tr key={row.id}>
                    <td>
                      {row.name}
                      <br />
                      <span className="muted small">{row.email}</span>
                      {row.phone ? (
                        <>
                          <br />
                          <span className="muted small">{row.phone}</span>
                        </>
                      ) : null}
                    </td>
                    <td>
                      <span
                        className="badge"
                        data-tone={
                          row.kind === "guest"
                            ? "amber"
                            : row.role === "admin"
                              ? "ink"
                              : "muted"
                        }
                      >
                        {row.kind === "guest" ? t("guest") : row.role}
                      </span>
                    </td>
                    <td className="num">{formatDate(row.joinedAt, locale)}</td>
                    <td className="num">{row.orderCount}</td>
                    <td>
                      {row.lastOrderAt ? (
                        <>
                          {formatDate(row.lastOrderAt, locale)}
                          <br />
                          <span
                            className="badge"
                            data-tone={orderStatusTone(
                              row.lastOrderStatus ?? "",
                            )}
                          >
                            {orderT(orderStatusKey(row.lastOrderStatus ?? ""))}
                          </span>
                        </>
                      ) : (
                        <span className="muted small">{t("noData")}</span>
                      )}
                    </td>
                    <td className="num">{formatMoney(row.spend, locale)}</td>
                    <td>
                      <button
                        type="button"
                        className="drawer-remove"
                        disabled={row.recentOrders.length === 0}
                        aria-expanded={isOpen}
                        onClick={() => setExpanded(isOpen ? null : row.id)}
                      >
                        <ChevronDown
                          size={13}
                          style={{
                            transform: isOpen ? "rotate(180deg)" : undefined,
                          }}
                        />
                        {isOpen ? t("hideOrders") : t("viewOrders")}
                      </button>
                    </td>
                  </tr>,
                  isOpen ? (
                    <tr
                      className="customer-detail-row"
                      key={`${row.id}-orders`}
                    >
                      <td colSpan={7}>
                        <p className="admin-section-title">
                          {t("recentOrders")}
                        </p>
                        <div className="table-wrap">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>{t("orderNumber")}</th>
                                <th>{t("placed")}</th>
                                <th>{t("status")}</th>
                                <th>{t("payment")}</th>
                                <th>{t("total")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.recentOrders.map((order) => (
                                <tr key={order.id}>
                                  <td>
                                    <Link href={`/admin/orders/${order.id}`}>
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
                                    {order.paymentMethod === "cod"
                                      ? orderT("paymentCod")
                                      : orderT("paymentInstapay")}
                                  </td>
                                  <td className="num">
                                    {formatMoney(order.total, locale)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
