import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLocale } from "@/lib/locale";
import type { StoreSettings } from "@/lib/settings-schema";
import { InstagramIcon } from "./instagram-icon";

type FooterCategory = {
  slug: string;
  nameEn: string;
  nameAr: string;
};

export async function SiteFooter({
  settings,
  categories,
}: {
  settings: StoreSettings;
  categories: FooterCategory[];
}) {
  const t = await getTranslations();
  const locale = await getLocale();
  const year = new Date().getFullYear();
  const brandName = locale === "ar" ? t("Brand.nameAr") : t("Brand.name");

  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="brand" aria-label={t("Brand.homeLabel")}>
              <Image
                src="/images/brand/logo-128.png"
                alt=""
                width={56}
                height={56}
                className="brand-logo"
              />
              <span className="brand-lockup">
                <span className="brand-mark">{brandName}</span>
                <span className="brand-sub">{t("Brand.tagline")}</span>
              </span>
            </Link>
            <p className="footer-intro">{t("Footer.intro")}</p>
            <div className="footer-brand-meta">
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="footer-social-pill"
              >
                <InstagramIcon />@{settings.instagram}
              </a>
            </div>
          </div>

          <div>
            <h3 className="footer-heading">{t("Footer.explore")}</h3>
            <div className="footer-links">
              <Link href="/shop">{t("Nav.shop")}</Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop?category=${category.slug}`}
                >
                  {locale === "ar" ? category.nameAr : category.nameEn}
                </Link>
              ))}
              <Link href="/story">{t("Nav.story")}</Link>
            </div>
          </div>

          <div>
            <h3 className="footer-heading">{t("Footer.contact")}</h3>
            <p className="footer-hours">{t("Footer.deliveryNote")}</p>
            <div className="footer-links">
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>
                {settings.phone}
              </a>
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("Footer.whatsapp")}
              </a>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
              <Link href="/contact">{t("Nav.contact")}</Link>
            </div>
            <p className="footer-hours" style={{ marginBlockStart: "0.9rem" }}>
              {locale === "ar" ? settings.addressAr : settings.addressEn}
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {year} {brandName}. {t("Footer.rights")}
          </span>

          <nav className="footer-legal" aria-label={t("Footer.help")}>
            <Link href="/info/shipping">{t("Footer.shipping")}</Link>
            <Link href="/info/privacy">{t("Footer.privacy")}</Link>
            <Link href="/info/terms">{t("Footer.terms")}</Link>
          </nav>

          <div className="footer-meta">
            <span>{t("Footer.madeIn")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
