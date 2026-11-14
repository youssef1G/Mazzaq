import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard } from "@/components/catalog/product-card";
import { ShopTools } from "@/components/catalog/shop-tools";
import { Link } from "@/i18n/navigation";
import { getCatalogProducts, getCategoriesWithCounts } from "@/lib/catalog";
import { getLocale } from "@/lib/locale";

type ShopSearchParams = {
  category?: string;
  q?: string;
  sort?: string;
};

const sortValues = ["price-asc", "price-desc", "newest"] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("shopTitle"),
    description: t("shopDescription"),
    alternates: { canonical: `/${locale}/shop` },
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: PageProps<"/[locale]/shop">) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const search: ShopSearchParams = query;
  const category = search.category?.trim() || undefined;
  const term = search.q?.trim() || undefined;
  const sort = sortValues.find((value) => value === search.sort);

  const [t, localeValue, products, categories] = await Promise.all([
    getTranslations("Shop"),
    getLocale(),
    getCatalogProducts({
      categorySlug: category,
      query: term,
      sort: sort ?? undefined,
    }),
    getCategoriesWithCounts(),
  ]);

  return (
    <>
      <section className="page-head">
        <div className="shell page-head-grid">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="page-title">
              {term ? t("resultsFor", { query: term }) : t("title")}
            </h1>
          </div>
          <p className="page-lead">{t("lead")}</p>
        </div>
      </section>

      <section className="shop-section">
        <div className="shell">
          <ShopTools
            categories={categories}
            category={category}
            query={term}
            sort={sort}
            locale={localeValue}
          />
          <div
            className="toolbar-end"
            style={{ paddingBlock: "0.9rem", justifyContent: "space-between" }}
          >
            <span className="result-count">
              {t("count", { count: products.length })}
            </span>
            {category || term ? (
              <Link href="/shop" className="text-link">
                {t("clear")}
              </Link>
            ) : null}
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden>
                ✳
              </span>
              <h2>{t("empty")}</h2>
              <p>{t("emptyLead")}</p>
              <Link href="/shop" className="button">
                {t("clear")}
              </Link>
            </div>
          ) : (
            <div className="shop-grid" style={{ marginBlockStart: "1.5rem" }}>
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
