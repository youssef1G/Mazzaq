import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/story">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("storyTitle"),
    description: t("storyDescription"),
    alternates: { canonical: `/${locale}/story` },
  };
}

export default async function StoryPage({
  params,
}: PageProps<"/[locale]/story">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, homeT] = await Promise.all([
    getTranslations("Story"),
    getTranslations("Home"),
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

      <section className="editorial-body">
        <div className="shell story-layout">
          <div className="story-image-stack">
            <div className="story-image">
              <Image
                src="/images/story/atelier.jpg"
                alt={t("chapter2Title")}
                fill
                sizes="(max-width: 1000px) 100vw, 38vw"
              />
            </div>
            <div className="story-image">
              <Image
                src="/images/story/maadi.jpg"
                alt={t("chapter2Title")}
                fill
                sizes="(max-width: 1000px) 70vw, 24vw"
              />
            </div>
          </div>

          <div className="story-chapters">
            <article>
              <h2>{t("chapter1Title")}</h2>
              <p>{t("chapter1Body")}</p>
            </article>
            <article>
              <h2>{t("chapter2Title")}</h2>
              <p>{t("chapter2Body")}</p>
            </article>

            <blockquote className="story-quote">{t("quote")}</blockquote>

            <article>
              <h2>{t("chapter3Title")}</h2>
              <p>{t("chapter3Body")}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div className="section-head-copy">
              <span className="eyebrow">{homeT("valuesEyebrow")}</span>
              <h2 className="section-title">{t("valuesTitle")}</h2>
            </div>
          </div>
          <div className="values-grid">
            {[
              [homeT("value1Title"), homeT("value1Body")],
              [homeT("value2Title"), homeT("value2Body")],
              [homeT("value3Title"), homeT("value3Body")],
            ].map(([title, body]) => (
              <article className="value" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
