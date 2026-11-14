import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const pages = {
  shipping: {
    title: "shippingTitle",
    lead: "shippingLead",
    body: "shippingBody",
  },
  privacy: {
    title: "privacyTitle",
    lead: "privacyLead",
    body: "privacyBody",
  },
  terms: {
    title: "termsTitle",
    lead: "termsLead",
    body: "termsBody",
  },
} as const;

type Slug = keyof typeof pages;

function isSlug(value: string): value is Slug {
  return value in pages;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/info/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: "Info" });
  return {
    title: t(pages[slug].title),
    alternates: { canonical: `/${locale}/info/${slug}` },
  };
}

export default async function InfoPage({
  params,
}: PageProps<"/[locale]/info/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!isSlug(slug)) notFound();

  const [t, footerT] = await Promise.all([
    getTranslations("Info"),
    getTranslations("Footer"),
  ]);
  const page = pages[slug];

  const links: Array<[Slug, string]> = [
    ["shipping", footerT("shipping")],
    ["privacy", footerT("privacy")],
    ["terms", footerT("terms")],
  ];

  return (
    <>
      <section className="editorial-hero">
        <div className="shell">
          <span className="eyebrow">{footerT("help")}</span>
          <h1>{t(page.title)}</h1>
          <p className="lead">{t(page.lead)}</p>
        </div>
      </section>

      <div className="shell info-layout">
        <aside className="info-aside">
          <div className="footer-links" style={{ marginBlockStart: "1.5rem" }}>
            {links.map(([key, label]) => (
              <Link
                key={key}
                href={`/info/${key}`}
                style={
                  key === slug
                    ? {
                        color: "var(--pomegranate)",
                        borderColor: "var(--pomegranate)",
                      }
                    : undefined
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </aside>

        <div className="prose">
          <p>{t(page.body)}</p>
          <p>
            <Link href="/contact" className="text-link">
              {t("contactTitle")}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
