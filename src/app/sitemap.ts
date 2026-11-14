import type { MetadataRoute } from "next";
import { getCatalogProducts, getCategoriesWithCounts } from "@/lib/catalog";

// The sitemap reads the live catalogue, so it has to be rendered per request
// rather than baked at build time.
export const dynamic = "force-dynamic";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const locales = ["en", "ar"] as const;

const staticPaths = [
  "",
  "/shop",
  "/story",
  "/contact",
  "/cart",
  "/info/shipping",
  "/info/privacy",
  "/info/terms",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getCatalogProducts({ limit: 500 }),
    getCategoriesWithCounts(),
  ]);

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.5,
        alternates: {
          languages: Object.fromEntries(
            locales.map((alternate) => [
              alternate,
              `${siteUrl}/${alternate}${path}`,
            ]),
          ),
        },
      });
    }

    for (const product of products) {
      entries.push({
        url: `${siteUrl}/${locale}/shop/${product.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: Object.fromEntries(
            locales.map((alternate) => [
              alternate,
              `${siteUrl}/${alternate}/shop/${product.slug}`,
            ]),
          ),
        },
      });
    }

    for (const category of categories) {
      const path = `/shop?category=${category.slug}`;
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
