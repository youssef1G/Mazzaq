import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/catalog/product-card";
import { Link } from "@/i18n/navigation";
import { getCategoriesWithCounts, getFeaturedProducts } from "@/lib/catalog";
import { categoryName } from "@/lib/catalog-types";
import { getLocale } from "@/lib/locale";
import { getHomeSettings } from "@/lib/settings";

export default async function HomePage() {
  const [t, locale, featured, categories, home] = await Promise.all([
    getTranslations("Home"),
    getLocale(),
    getFeaturedProducts(3),
    getCategoriesWithCounts(),
    getHomeSettings(),
  ]);

  const ar = locale === "ar";
  const pick = (en: string, valueAr: string) => (ar ? valueAr : en);

  return (
    <>
      {/* Hero ------------------------------------------------------------ */}
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{t("heroEyebrow")}</span>
            <h1 className="display hero-title">
              <span className="hero-line">
                {pick(home.heroTitleAEn, home.heroTitleAAr)}
              </span>
              <span className="hero-line">
                <em>{pick(home.heroTitleEmEn, home.heroTitleEmAr)}</em>{" "}
                {pick(home.heroTitleBEn, home.heroTitleBAr)}
              </span>
            </h1>
            <p className="hero-lead">
              {pick(home.heroLeadEn, home.heroLeadAr)}
            </p>
            <div className="hero-actions">
              <Link href="/shop" className="button">
                {t("heroCta")}
                <ArrowRight size={15} strokeWidth={1.6} />
              </Link>
              <Link href="/story" className="text-link">
                {t("heroSecondary")}
              </Link>
            </div>
          </div>

          <div className="hero-media">
            <div className="hero-frame">
              <Image
                src={home.heroImage}
                alt={t("heroCaption")}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 46vw"
              />
            </div>
            <div className="hero-stamp" aria-hidden>
              <Image
                src="/images/brand/logo-128.png"
                alt=""
                width={124}
                height={124}
              />
            </div>
          </div>
        </div>
      </section>

      {/* The pastry case ------------------------------------------------- */}
      <section className="section">
        <div className="shell">
          <div className="section-head" data-reveal>
            <div className="section-head-copy">
              <span className="eyebrow">{t("featuredEyebrow")}</span>
              <h2 className="section-title">{t("featuredTitle")}</h2>
              <p className="section-lead">{t("featuredLead")}</p>
            </div>
            <div className="section-head-action">
              <Link href="/shop" className="text-link">
                {t("viewAll")}
              </Link>
            </div>
          </div>
          <div className="product-grid">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 2}
              />
            ))}
          </div>
        </div>
      </section>

      {/* By occasion ----------------------------------------------------- */}
      <section className="section-tight">
        <div className="shell">
          <div className="section-head" data-reveal>
            <div className="section-head-copy">
              <span className="eyebrow">{t("categoriesEyebrow")}</span>
              <h2 className="section-title">{t("categoriesTitle")}</h2>
              <p className="section-lead">{t("categoriesLead")}</p>
            </div>
          </div>
          <div className="cat-tiles">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="cat-tile"
                data-reveal="scale"
              >
                <Image
                  src={category.imageUrl ?? "/images/editorial/pastry-case.jpg"}
                  alt=""
                  fill
                  sizes="(max-width: 780px) 100vw, (max-width: 1180px) 50vw, 33vw"
                />
                <span className="cat-tile-body">
                  <span>
                    <span className="cat-tile-name">
                      {categoryName(category, locale)}
                    </span>
                    <span className="cat-tile-count">
                      {t("itemsCount", { count: category.count })}
                    </span>
                  </span>
                  <span className="cat-tile-arrow" aria-hidden>
                    <ArrowRight size={15} strokeWidth={1.6} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* From the atelier ------------------------------------------------ */}
      <section className="gallery-band section">
        <div className="shell">
          <div className="section-head" data-reveal>
            <div className="section-head-copy">
              <span className="eyebrow">{t("galleryEyebrow")}</span>
              <h2 className="section-title">
                {pick(home.galleryTitleEn, home.galleryTitleAr)}
              </h2>
              <p className="section-lead">
                {pick(home.galleryLeadEn, home.galleryLeadAr)}
              </p>
            </div>
            <div className="section-head-action">
              <Link href="/story" className="text-link">
                {t("heroSecondary")}
              </Link>
            </div>
          </div>

          <div className="gallery-wall">
            {home.gallery.map((image, index) => (
              <figure
                className={`gallery-tile ${image.shape}`}
                key={image.src}
                data-reveal="scale"
                style={{ transitionDelay: `${index * 55}ms` }}
              >
                <Image
                  src={image.src}
                  alt={pick(image.captionEn, image.captionAr)}
                  fill
                  sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
                />
                <figcaption>
                  {pick(image.captionEn, image.captionAr)}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call ---------------------------------------------------- */}
      <section className="cta-band">
        <div className="shell cta-band-inner" data-reveal="fade">
          <div>
            <span className="eyebrow">{t("ctaEyebrow")}</span>
            <h2>{pick(home.ctaTitleEn, home.ctaTitleAr)}</h2>
            <p>{pick(home.ctaLeadEn, home.ctaLeadAr)}</p>
          </div>
          <Link href="/shop" className="button">
            {pick(home.ctaButtonEn, home.ctaButtonAr)}
            <ArrowRight size={15} strokeWidth={1.6} />
          </Link>
        </div>
      </section>
    </>
  );
}
