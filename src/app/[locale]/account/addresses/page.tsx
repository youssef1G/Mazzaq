import { asc, desc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  deleteAddress,
  saveAddress,
  setDefaultAddress,
} from "@/actions/account";
import {
  AddressFields,
  type AddressValue,
} from "@/components/account/address-fields";
import { ConfirmButton } from "@/components/account/confirm-button";
import { getDb } from "@/db";
import { addresses } from "@/db/schema";
import { requireUser } from "@/lib/session";

export default async function AddressesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/account/addresses">) {
  const [{ locale }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("Account"),
  ]);
  setRequestLocale(locale);
  const session = await requireUser(locale);

  const db = await getDb();
  const rows = await db.query.addresses.findMany({
    where: eq(addresses.userId, session.user.id),
    orderBy: [desc(addresses.isDefault), asc(addresses.createdAt)],
  });

  const values: AddressValue[] = rows.map((row) => ({
    id: row.id,
    label: row.label,
    recipientName: row.recipientName,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    area: row.area,
    postalCode: row.postalCode,
    isDefault: row.isDefault,
  }));

  return (
    <div>
      <header className="account-head">
        <div>
          <h1>{t("addresses")}</h1>
          <p>{t("lead")}</p>
        </div>
      </header>

      {query.saved ? <p className="form-success">{t("saved")}</p> : null}
      {query.error ? <p className="form-error">{t("errorRequired")}</p> : null}

      <details className="card account-add" open={values.length === 0}>
        <summary>{t("addAddress")}</summary>
        <form action={saveAddress} className="admin-form">
          <input type="hidden" name="locale" value={locale} />
          <AddressFields prefix="new-address" />
          <div>
            <button type="submit" className="button">
              {t("save")}
            </button>
          </div>
        </form>
      </details>

      {values.length === 0 ? (
        <p className="muted" style={{ marginBlockStart: "1.5rem" }}>
          {t("noAddresses")}
        </p>
      ) : (
        <div className="address-grid" style={{ marginBlockStart: "1.25rem" }}>
          {values.map((address) => (
            <article
              className="address-card"
              key={address.id}
              data-default={address.isDefault}
            >
              <h3>
                {address.label}
                {address.isDefault ? (
                  <span className="badge" data-tone="green">
                    {t("default")}
                  </span>
                ) : null}
              </h3>
              <p>
                {address.recipientName}
                <br />
                {address.line1}
                {address.line2 ? (
                  <>
                    <br />
                    {address.line2}
                  </>
                ) : null}
                <br />
                {address.area}, {address.city}
                {address.postalCode ? ` ${address.postalCode}` : ""}
                <br />
                {address.phone}
              </p>

              <details className="address-edit">
                <summary>{t("editAddress")}</summary>
                <form action={saveAddress} className="admin-form">
                  <input type="hidden" name="locale" value={locale} />
                  <AddressFields
                    address={address}
                    prefix={`edit-${address.id}`}
                  />
                  <div>
                    <button type="submit" className="button button-small">
                      {t("save")}
                    </button>
                  </div>
                </form>
              </details>

              <div className="address-actions">
                {!address.isDefault ? (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit">{t("defaultAddress")}</button>
                  </form>
                ) : null}
                <form action={deleteAddress}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={address.id} />
                  <ConfirmButton danger message={t("deleteConfirm")}>
                    {t("deleteAddress")}
                  </ConfirmButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
