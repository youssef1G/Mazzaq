import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/contact/contact-form";
import { Link } from "@/i18n/navigation";
import { getStoreSettings } from "@/lib/settings";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: { canonical: `/${locale}/contact` },
  };
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, navT, infoT, store] = await Promise.all([
    getTranslations("Contact"),
    getTranslations("Nav"),
    getTranslations("Info"),
    getStoreSettings(),
  ]);

  return (
    <>
      <section className="editorial-hero">
        <div className="shell">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
        </div>
      </section>

      <div className="shell contact-layout">
        <div className="contact-info">
          <div className="contact-info-block">
            <h3>{t("delivery")}</h3>
            <p>{t("deliveryValue")}</p>
          </div>
          <div className="contact-info-block">
            <h3>{t("call")}</h3>
            <a href={`tel:${store.phone.replace(/\s/g, "")}`}>{store.phone}</a>
            <a
              href={`https://wa.me/${store.whatsapp.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
          <div className="contact-info-block">
            <h3>{t("write")}</h3>
            <a href={`mailto:${store.email}`}>{store.email}</a>
          </div>
          <div className="contact-info-block">
            <h3>{t("follow")}</h3>
            <a
              href={`https://instagram.com/${store.instagram}`}
              target="_blank"
              rel="noreferrer"
            >
              @{store.instagram}
            </a>
          </div>
          <div className="contact-info-block">
            <h3>{t("visit")}</h3>
            <p>{locale === "ar" ? store.addressAr : store.addressEn}</p>
          </div>
        </div>

        <div>
          <ContactForm />
          <div className="story-quote" style={{ marginBlockStart: "1.5rem" }}>
            <blockquote>{infoT("contactTitle")}</blockquote>
            <cite>{infoT("contactLead")}</cite>
          </div>
        </div>
      </div>

      <section className="cta-band">
        <div className="shell cta-band-inner">
          <div>
            <span className="eyebrow">{navT("shop")}</span>
            <h2>{infoT("contactTitle")}</h2>
            <p>{infoT("contactBody")}</p>
          </div>
          <Link href="/shop" className="button">
            {navT("shop")}
          </Link>
        </div>
      </section>
    </>
  );
}
