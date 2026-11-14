import { getTranslations, setRequestLocale } from "next-intl/server";
import { updateProfile } from "@/actions/account";
import { PasswordForm } from "@/components/account/password-form";
import { requireUser } from "@/lib/session";

export default async function ProfilePage({
  params,
  searchParams,
}: PageProps<"/[locale]/account/profile">) {
  const [{ locale }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("Account"),
  ]);
  setRequestLocale(locale);
  const session = await requireUser(locale);

  return (
    <div>
      <header className="account-head">
        <div>
          <h1>{t("profile")}</h1>
          <p>{t("profileLead")}</p>
        </div>
      </header>

      {query.saved ? (
        <p className="form-success">{t("profileUpdated")}</p>
      ) : null}
      {query.error ? <p className="form-error">{t("errorRequired")}</p> : null}

      <section className="card">
        <div className="card-head">
          <h2>{t("profileTitle")}</h2>
        </div>
        <form action={updateProfile} className="admin-form">
          <input type="hidden" name="locale" value={locale} />
          <div className="admin-form-grid">
            <div className="field">
              <label htmlFor="name">{t("recipient")}</label>
              <input
                id="name"
                name="name"
                className="input"
                required
                autoComplete="name"
                defaultValue={session.user.name}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">{t("phone")}</label>
              <input
                id="phone"
                name="phone"
                className="input"
                inputMode="tel"
                autoComplete="tel"
                defaultValue={session.user.phone ?? ""}
              />
            </div>
            <div className="field span-2">
              <label htmlFor="email">{t("email")}</label>
              <input
                id="email"
                name="email"
                className="input"
                type="email"
                value={session.user.email}
                readOnly
                disabled
              />
              <span className="form-note">{t("emailReadonly")}</span>
            </div>
          </div>
          <div>
            <button type="submit" className="button">
              {t("updateProfile")}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>{t("passwordTitle")}</h2>
          <p>{t("passwordLead")}</p>
        </div>
        <PasswordForm />
      </section>
    </div>
  );
}
