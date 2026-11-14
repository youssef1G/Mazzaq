import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { Toaster } from "sonner";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import { ChromeGate } from "@/components/layout/chrome-gate";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { routing } from "@/i18n/routing";
import { getBestSellerProduct, getCategoriesWithCounts } from "@/lib/catalog";
import { getSession } from "@/lib/session";
import { getDeliverySettings, getStoreSettings } from "@/lib/settings";
import "@/styles/globals.css";
import "@/styles/maison.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffbf4",
  colorScheme: "light",
};

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const brand = locale === "ar" ? "مزاق" : "Mazzaق";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("homeTitle"),
      template: `%s — ${brand}`,
    },
    description: t("homeDescription"),
    applicationName: brand,
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
      },
    },
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      url: `/${locale}`,
      siteName: brand,
      locale: locale === "ar" ? "ar_EG" : "en_EG",
      type: "website",
      images: [
        {
          url: "/images/brand/logo-512.png",
          width: 512,
          height: 512,
          alt:
            locale === "ar"
              ? "مزاق — طعم يرجّعك لزمان"
              : "Mazzaق — taste that takes you back",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("homeTitle"),
      description: t("homeDescription"),
      images: ["/images/editorial/hero.jpg"],
    },
    icons: {
      icon: [
        {
          url: "/images/brand/logo-128.png",
          sizes: "128x128",
          type: "image/png",
        },
        {
          url: "/images/brand/logo-512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: "/images/brand/logo-512.png",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [messages, store, delivery, session, categories, bestSeller] =
    await Promise.all([
      getMessages(),
      getStoreSettings(),
      getDeliverySettings(),
      getSession(),
      getCategoriesWithCounts(),
      getBestSellerProduct(),
    ]);

  const user = session?.user
    ? { name: session.user.name, role: session.user.role ?? "user" }
    : null;

  const headerCategories = categories.map((category) => ({
    slug: category.slug,
    nameEn: category.nameEn,
    nameAr: category.nameAr,
  }));

  const headerFeature = bestSeller
    ? {
        slug: bestSeller.slug,
        nameEn: bestSeller.nameEn,
        nameAr: bestSeller.nameAr,
        shortDescriptionEn: bestSeller.shortDescriptionEn,
        shortDescriptionAr: bestSeller.shortDescriptionAr,
        imageUrl: bestSeller.imageUrl,
      }
    : null;

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${manrope.variable} ${plexArabic.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static one-liner that must run before first paint so reveal-hidden content only exists when JS is guaranteed to hydrate; without JS everything stays visible.
          dangerouslySetInnerHTML={{
            __html: 'document.documentElement.classList.add("reveal-ready")',
          }}
        />
        <div className="scroll-progress" aria-hidden />
        <NextIntlClientProvider messages={messages}>
          <CartProvider>
            <ScrollReveal />
            <a href="#main" className="skip-link">
              {locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
            </a>
            <ChromeGate
              header={
                <SiteHeader
                  user={user}
                  categories={headerCategories}
                  feature={headerFeature}
                />
              }
              footer={
                <SiteFooter settings={store} categories={headerCategories} />
              }
            >
              <main id="main">{children}</main>
            </ChromeGate>
            <CartDrawer
              freeDeliveryThreshold={delivery.freeDeliveryThreshold}
            />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--ink)",
                  color: "var(--paper)",
                  border: "1px solid var(--ink)",
                  fontFamily: "var(--font-sans)",
                },
              }}
            />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
