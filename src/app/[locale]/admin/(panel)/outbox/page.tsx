import { desc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { getDb } from "@/db";
import { emailOutbox } from "@/db/schema";
import { Link } from "@/i18n/navigation";
import { formatDateTime } from "@/lib/money";

const statusOptions = ["logged", "sent", "failed"];

export default async function AdminOutboxPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/outbox">) {
  const [{ locale }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("Admin"),
  ]);
  setRequestLocale(locale);

  const status = String(query.status ?? "").trim();
  const activeStatus = statusOptions.includes(status) ? status : "";

  const db = await getDb();
  const rows = await db.query.emailOutbox.findMany({
    where: activeStatus ? eq(emailOutbox.status, activeStatus) : undefined,
    orderBy: [desc(emailOutbox.createdAt)],
    limit: 100,
  });

  const templateLabels: Record<string, string> = {
    "order-confirmation": t("templateOrder"),
    contact: t("templateContact"),
    "reset-password": t("templateReset"),
    "password-changed": t("templatePasswordChanged"),
    "verify-email": t("templateVerify"),
    welcome: t("templateWelcome"),
  };
  const templateLabel = (value: string) => templateLabels[value] ?? value;

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("outboxTitle")}</h1>
        <div className="admin-topbar-actions">
          <span>{rows.length}</span>
        </div>
      </header>

      <div className="admin-content">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>{t("outboxTitle")}</h2>
            <p className="muted small">{t("outboxLead")}</p>
          </div>

          <form method="get" className="admin-toolbar">
            <DropdownSelect
              name="status"
              compact
              submitOnChange
              defaultValue={activeStatus}
              label={t("filterStatus")}
              options={[
                { value: "", label: t("allStatuses") },
                { value: "logged", label: t("statusLogged") },
                { value: "sent", label: t("statusSent") },
                { value: "failed", label: t("statusFailed") },
              ]}
            />
          </form>

          <p className="muted small" style={{ marginBlockEnd: "1rem" }}>
            {t("outboxNote")}
          </p>

          {rows.length === 0 ? (
            <p className="muted small">{t("noData")}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("to")}</th>
                    <th>{t("subject")}</th>
                    <th>{t("template")}</th>
                    <th>{t("sentAt")}</th>
                    <th>{t("status")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.to}</td>
                      <td>{row.subject}</td>
                      <td>
                        <span className="muted small">
                          {templateLabel(row.template)}
                        </span>
                      </td>
                      <td className="num">
                        {formatDateTime(row.createdAt, locale)}
                      </td>
                      <td>
                        <span
                          className="badge"
                          data-tone={
                            row.status === "sent"
                              ? "green"
                              : row.status === "failed"
                                ? "red"
                                : "muted"
                          }
                        >
                          {row.status === "sent"
                            ? t("statusSent")
                            : row.status === "failed"
                              ? t("statusFailed")
                              : t("statusLogged")}
                        </span>
                      </td>
                      <td>
                        <Link href={`/admin/outbox/${row.id}`}>
                          {t("viewEmail")}
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
