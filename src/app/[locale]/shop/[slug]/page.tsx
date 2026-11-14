import { Clock3, Gift } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AddToCart } from "@/components/cart/add-to-cart";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { Link } from "@/i18n/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import {
  lowestPrice,
  productDescription,
  productImageAlt,
  productName,
  productShortDescription,
} from "@/lib/catalog-types";
import { getLocale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const description =
    locale === "ar" ? product.shortDescriptionAr : product.shortDescriptionEn;
  return {
    title: name,
    description,
    alternates: { canonical: `/${locale}/shop/${product.slug}` },
    openGraph: {
      title: name,
      description,
      images: [{ url: product.imageUrl }],
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/shop/[slug]">) {
  const [{ locale, slug }, t, localeValue] = await Promise.all([
    params,
    getTranslations("Product"),
    getLocale(),
  ]);
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, commons] = await Promise.all([
    getRelatedProducts(product, 3),
    getTranslations("Common"),
  ]);
  const name = productName(product, localeValue);
  const defaultVariant =
    product.variants.find((variant) => variant.isDefault) ??
    product.variants[0];
  const price = lowestPrice(product);
  const soldOut = product.variants.every(
    (variant) => variant.trackInventory && variant.stock <= 0,
  );
  const categoryLabel =
    localeValue === "ar" ? product.categoryNameAr : product.categoryNameEn;
  const galleryImages =
    product.images.length > 0
      ? [...product.images]
          .sort(
            (a, b) =>
              Number(b.isPrimary) - Number(a.isPrimary) ||
              a.sortOrder - b.sortOrder,
          )
          .map((image) => ({
            id: image.id,
            url: image.url,
            alt:
              (localeValue === "ar" ? image.altAr : image.altEn) ||
              productImageAlt(product, localeValue),
          }))
      : [
          {
            id: product.id,
            url: product.imageUrl,
            alt: productImageAlt(product, localeValue),
          },
        ];

  return (
    <>
      <div className="shell product-detail">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/shop">{t("back")}</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{categoryLabel}</span>
          <span className="breadcrumb-sep">/</span>
          <span>{name}</span>
        </nav>

        <div className="product-layout">
          <ProductGallery images={galleryImages} name={name} />

          <div className="product-panel">
            <span className="eyebrow">{categoryLabel}</span>
            <h1>{name}</h1>
            <p className="product-short">
              {productShortDescription(product, localeValue)}
            </p>

            <div className="product-price-row">
              <span className="product-price-large">
                {t("from")} {formatMoney(price, localeValue)}
              </span>
              {defaultVariant?.compareAtPrice ? (
                <s>{formatMoney(defaultVariant.compareAtPrice, localeValue)}</s>
              ) : null}
              <span
                className="stock-note"
                data-low={defaultVariant ? defaultVariant.stock <= 6 : false}
              >
                {soldOut
                  ? t("soldOut")
                  : defaultVariant && defaultVariant.stock <= 6
                    ? t("lowStock", { count: defaultVariant.stock })
                    : t("inStock")}
              </span>
            </div>

            <AddToCart product={product} />

            <div className="product-note">
              <Clock3 size={15} strokeWidth={1.6} aria-hidden />
              <span>
                {t("leadTime")}:{" "}
                {t("leadTimeValue", { hours: product.leadTimeHours })}
              </span>
            </div>
            <div className="product-note">
              <Gift size={15} strokeWidth={1.6} aria-hidden />
              <span>{t("giftBoxNote")}</span>
            </div>

            <div className="product-accordions">
              <details className="accordion-item">
                <summary className="accordion-trigger">{t("storage")}</summary>
                <div className="accordion-content">
                  <p>{t("storageBody")}</p>
                </div>
              </details>
              <details className="accordion-item">
                <summary className="accordion-trigger">{t("details")}</summary>
                <div className="accordion-content">
                  <p>{productDescription(product, localeValue)}</p>
                  <p>
                    {t("category")}: {categoryLabel} · {commons("currency")}
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="related-section">
          <div className="shell">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow">{t("related")}</span>
              </div>
            </div>
            <div className="product-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data is built from our own catalogue
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name,
            description: product.descriptionEn,
            image:
              product.images.length > 0
                ? product.images.map((image) => image.url)
                : product.imageUrl,
            brand: { "@type": "Brand", name: "Mazzaق" },
            offers: {
              "@type": "Offer",
              priceCurrency: "EGP",
              price: (price / 100).toFixed(2),
              availability: soldOut
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            },
          }),
        }}
      />
    </>
  );
}
