import { desc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { saveDiscount, toggleDiscount } from "@/actions/admin";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { getDb } from "@/db";
import { discounts } from "@/db/schema";
import { formatMoney } from "@/lib/money";

export default async function AdminDiscountsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/discounts">) {
  const [{ locale }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("Admin"),
  ]);
  setRequestLocale(locale);

  const db = await getDb();
  const rows = await db.query.discounts.findMany({
    orderBy: [desc(discounts.createdAt)],
    limit: 100,
  });

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("discountsTitle")}</h1>
        <div className="admin-topbar-actions">
          <span>{rows.length}</span>
        </div>
      </header>

      <div className="admin-content">
        {query.saved ? (
          <p className="form-success">{t("savedSettings")}</p>
        ) : null}
        {query.error === "code" ? (
          <p className="form-error">{t("errorCode")}</p>
        ) : query.error ? (
          <p className="form-error">{t("errorRequired")}</p>
        ) : null}

        <div className="admin-grid">
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>{t("discountsTitle")}</h2>
              <p className="muted small">{t("discountsLead")}</p>
            </div>

            {rows.length === 0 ? (
              <p className="muted small">{t("noData")}</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("code")}</th>
                      <th>{t("type")}</th>
                      <th>{t("value")}</th>
                      <th>{t("minSubtotal")}</th>
                      <th>{t("used")}</th>
                      <th>{t("discountActive")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.code}</strong>
                        </td>
                        <td>
                          {row.type === "percentage"
                            ? t("percentage")
                            : t("fixed")}
                        </td>
                        <td className="num">
                          {row.type === "percentage"
                            ? `${row.value}%`
                            : formatMoney(row.value, locale)}
                        </td>
                        <td className="num">
                          {formatMoney(row.minSubtotal, locale)}
                        </td>
                        <td className="num">
                          {row.usedCount}
                          {row.maxUses ? ` / ${row.maxUses}` : ""}
                        </td>
                        <td>
                          <span
                            className="badge"
                            data-tone={row.isActive ? "green" : "muted"}
                          >
                            {row.isActive ? t("discountActive") : "—"}
                          </span>
                        </td>
                        <td>
                          <form action={toggleDiscount}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="id" value={row.id} />
                            <button type="submit" className="text-link">
                              {row.isActive ? t("block") : t("unblock")}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-card">
            <div className="admin-card-head">
              <h2>{t("createDiscount")}</h2>
            </div>
            <form action={saveDiscount} className="admin-form">
              <input type="hidden" name="locale" value={locale} />
              <div className="field">
                <label htmlFor="code">{t("code")}</label>
                <input
                  id="code"
                  name="code"
                  className="input"
                  required
                  placeholder="MAZQA10"
                />
              </div>
              <div className="field">
                <label htmlFor="type">{t("type")}</label>
                <DropdownSelect
                  id="type"
                  name="type"
                  label={t("type")}
                  defaultValue="percentage"
                  options={[
                    { value: "percentage", label: t("percentage") },
                    { value: "fixed", label: t("fixed") },
                  ]}
                />
              </div>
              <div className="field">
                <label htmlFor="value">{t("value")}</label>
                <input
                  id="value"
                  name="value"
                  className="input"
                  type="number"
                  min={0}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="minSubtotal">{t("minSubtotal")}</label>
                <input
                  id="minSubtotal"
                  name="minSubtotal"
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={0}
                />
              </div>
              <div className="field">
                <label htmlFor="maxUses">{t("maxUses")}</label>
                <input
                  id="maxUses"
                  name="maxUses"
                  className="input"
                  type="number"
                  min={1}
                />
              </div>
              <div className="field">
                <label htmlFor="startsAt">{t("startsAt")}</label>
                <input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  className="input"
                />
              </div>
              <div className="field">
                <label htmlFor="endsAt">{t("endsAt")}</label>
                <input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  className="input"
                />
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  defaultChecked
                />
                <span>{t("discountActive")}</span>
              </label>
              <div>
                <button type="submit" className="button button-small">
                  {t("createDiscount")}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
