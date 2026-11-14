import { getTranslations, setRequestLocale } from "next-intl/server";
import { saveDeliverySettings, saveStoreSettings } from "@/actions/admin";
import { HomeEditor } from "@/components/admin/home-editor";
import {
  getDeliverySettings,
  getHomeSettings,
  getStoreSettings,
} from "@/lib/settings";

export default async function AdminSettingsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/settings">) {
  const [{ locale }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("Admin"),
  ]);
  setRequestLocale(locale);

  const [store, delivery, home] = await Promise.all([
    getStoreSettings(),
    getDeliverySettings(),
    getHomeSettings(),
  ]);

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("settingsTitle")}</h1>
      </header>

      <div className="admin-content">
        {query.saved ? (
          <p className="form-success">{t("savedSettings")}</p>
        ) : null}
        {query.error ? (
          <p className="form-error">{t("errorRequired")}</p>
        ) : null}

        <div className="admin-grid">
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>{t("storeSettings")}</h2>
              <p className="muted small">{t("settingsLead")}</p>
            </div>
            <form action={saveStoreSettings} className="admin-form">
              <input type="hidden" name="locale" value={locale} />
              <div className="admin-form-grid">
                <div className="field">
                  <label htmlFor="phone">{t("phone")}</label>
                  <input
                    id="phone"
                    name="phone"
                    className="input"
                    dir="ltr"
                    required
                    defaultValue={store.phone}
                  />
                </div>
                <div className="field">
                  <label htmlFor="whatsapp">{t("whatsapp")}</label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    className="input"
                    dir="ltr"
                    required
                    defaultValue={store.whatsapp}
                  />
                </div>
                <div className="field span-2">
                  <label htmlFor="email">{t("email")}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="input"
                    dir="ltr"
                    required
                    defaultValue={store.email}
                  />
                </div>
                <div className="field span-2">
                  <label htmlFor="addressEn">{t("address")} (EN)</label>
                  <input
                    id="addressEn"
                    name="addressEn"
                    className="input"
                    dir="ltr"
                    required
                    defaultValue={store.addressEn}
                  />
                </div>
                <div className="field span-2">
                  <label htmlFor="addressAr">{t("address")} (AR)</label>
                  <input
                    id="addressAr"
                    name="addressAr"
                    className="input"
                    dir="rtl"
                    required
                    defaultValue={store.addressAr}
                  />
                </div>
                <div className="field">
                  <label htmlFor="instapayHandle">{t("instapayHandle")}</label>
                  <input
                    id="instapayHandle"
                    name="instapayHandle"
                    className="input"
                    dir="ltr"
                    required
                    defaultValue={store.instapayHandle}
                  />
                </div>
                <div className="field">
                  <label htmlFor="instagram">{t("instagram")}</label>
                  <input
                    id="instagram"
                    name="instagram"
                    className="input"
                    dir="ltr"
                    required
                    defaultValue={store.instagram}
                  />
                </div>
              </div>
              <p className="form-note">{t("settingsContactNote")}</p>
              <div>
                <button type="submit" className="button">
                  {t("saveSettings")}
                </button>
              </div>
            </form>
          </section>

          <section className="admin-card">
            <div className="admin-card-head">
              <h2>{t("deliverySettings")}</h2>
            </div>
            <form action={saveDeliverySettings} className="admin-form">
              <input type="hidden" name="locale" value={locale} />
              <div className="admin-form-grid">
                <div className="field">
                  <label htmlFor="deliveryFee">{t("deliveryFee")}</label>
                  <input
                    id="deliveryFee"
                    name="deliveryFee"
                    className="input"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={(delivery.deliveryFee / 100).toFixed(2)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="freeThreshold">{t("freeThreshold")}</label>
                  <input
                    id="freeThreshold"
                    name="freeThreshold"
                    className="input"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    defaultValue={
                      delivery.freeDeliveryThreshold > 0
                        ? (delivery.freeDeliveryThreshold / 100).toFixed(2)
                        : ""
                    }
                  />
                  <span className="form-note">{t("freeThresholdNote")}</span>
                </div>
              </div>
              <div>
                <button type="submit" className="button">
                  {t("saveSettings")}
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>{t("homepageTitle")}</h2>
            <p className="muted small">{t("homepageLead")}</p>
          </div>
          <HomeEditor initial={home} />
        </section>
      </div>
    </>
  );
}
