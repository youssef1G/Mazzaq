"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

type HeaderUser = {
  name: string;
  role: string;
} | null;

type HeaderCategory = {
  slug: string;
  nameEn: string;
  nameAr: string;
};

type HeaderFeature = {
  slug: string;
  nameEn: string;
  nameAr: string;
  shortDescriptionEn: string;
  shortDescriptionAr: string;
  imageUrl: string;
} | null;

function categoryLabel(category: HeaderCategory, locale: string) {
  return locale === "ar" ? category.nameAr : category.nameEn;
}

export function SiteHeader({
  user,
  categories,
  feature,
}: {
  user: HeaderUser;
  categories: HeaderCategory[];
  feature: HeaderFeature;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { count, openCart, hydrated } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const otherLocale = locale === "ar" ? "en" : "ar";
  const brandName = locale === "ar" ? t("Brand.nameAr") : t("Brand.name");
  const activeCategory = searchParams.get("category");
  const shopActive = pathname === "/shop";

  const searchItems: { href: string; label: string }[] = [
    { href: "/shop", label: t("Header.shopAll") },
    ...categories.map((category) => ({
      href: `/shop?category=${category.slug}`,
      label: categoryLabel(category, locale),
    })),
  ];

  function isCategoryActive(slug: string | null) {
    if (!shopActive || !slug) return false;
    return slug === activeCategory;
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the menus whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    setSearchOpen(false);
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  }

  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <Link
            href="/"
            className="brand header-brand"
            aria-label={t("Brand.homeLabel")}
          >
            <Image
              src="/images/brand/logo-128.png"
              alt=""
              width={40}
              height={40}
              className="brand-logo"
              priority
            />
            <span className="brand-lockup">
              <span className="brand-mark">{brandName}</span>
            </span>
          </Link>

          <nav className="nav-primary" aria-label={t("Nav.shop")}>
            <DropdownMenu.Root dir={locale === "ar" ? "rtl" : "ltr"}>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="nav-link nav-trigger"
                  data-active={shopActive}
                >
                  {t("Nav.shop")}
                  <ChevronDown size={12} strokeWidth={1.8} aria-hidden />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="menu-surface nav-menu"
                  align="start"
                  sideOffset={14}
                >
                  <div
                    className={`nav-menu-grid${feature ? "" : " is-single"}`}
                  >
                    <div className="nav-menu-links">
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/shop"
                          className="nav-menu-link nav-menu-all"
                        >
                          {t("Header.shopAll")}
                          <ArrowUpRight size={13} strokeWidth={1.6} />
                        </Link>
                      </DropdownMenu.Item>
                      {categories.map((category) => (
                        <DropdownMenu.Item key={category.slug} asChild>
                          <Link
                            href={`/shop?category=${category.slug}`}
                            className="nav-menu-link"
                            data-active={isCategoryActive(category.slug)}
                          >
                            {categoryLabel(category, locale)}
                          </Link>
                        </DropdownMenu.Item>
                      ))}
                    </div>

                    {feature ? (
                      <DropdownMenu.Item asChild>
                        <Link
                          href={`/shop/${feature.slug}`}
                          className="nav-menu-feature"
                        >
                          <Image
                            src={feature.imageUrl}
                            alt=""
                            fill
                            sizes="240px"
                          />
                          <span className="nav-menu-feature-body">
                            <strong>
                              {locale === "ar"
                                ? feature.nameAr
                                : feature.nameEn}
                            </strong>
                            <span>
                              {locale === "ar"
                                ? feature.shortDescriptionAr
                                : feature.shortDescriptionEn}
                            </span>
                          </span>
                        </Link>
                      </DropdownMenu.Item>
                    ) : null}
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <Link
              href="/story"
              className="nav-link"
              data-active={pathname === "/story"}
            >
              {t("Nav.story")}
            </Link>
            <Link
              href="/contact"
              className="nav-link"
              data-active={pathname === "/contact"}
            >
              {t("Nav.contact")}
            </Link>
            {user ? (
              <Link
                href="/account/orders"
                className="nav-link"
                data-active={pathname === "/account/orders"}
              >
                {t("Nav.myOrders")}
              </Link>
            ) : null}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="button-icon"
              aria-label={t("Header.search")}
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} strokeWidth={1.5} />
            </button>
            <Link
              href={user ? "/account" : "/sign-in"}
              className="button-icon"
              aria-label={t("Header.account")}
            >
              <User size={17} strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              className="button-icon cart-button"
              aria-label={t("Header.cart")}
              onClick={openCart}
            >
              <ShoppingBag size={17} strokeWidth={1.5} />
              {hydrated && count > 0 ? (
                <span className="cart-count">{count}</span>
              ) : null}
            </button>
            <Link
              href={pathname}
              locale={otherLocale}
              className="lang-switch"
              aria-label={t("Header.languageLabel")}
            >
              {t("Header.language")}
            </Link>
            <button
              type="button"
              className="button-icon mobile-toggle"
              aria-label={t("Header.menu")}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Content className="mobile-menu" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{t("Header.menu")}</Dialog.Title>
            <div className="mobile-menu-head">
              <Link
                href="/"
                className="brand"
                aria-label={t("Brand.homeLabel")}
              >
                <Image
                  src="/images/brand/logo-128.png"
                  alt=""
                  width={44}
                  height={44}
                  className="brand-logo"
                />
                <span className="brand-lockup">
                  <span className="brand-mark">{brandName}</span>
                </span>
              </Link>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="button-icon mobile-menu-close"
                  aria-label={t("Header.close")}
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </Dialog.Close>
            </div>

            <nav className="mobile-menu-nav">
              <span className="mobile-menu-label">{t("Nav.shop")}</span>
              <Link href="/shop" className="mobile-menu-link">
                {t("Header.shopAll")}
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop?category=${category.slug}`}
                  className="mobile-menu-link"
                >
                  {categoryLabel(category, locale)}
                </Link>
              ))}

              <span className="mobile-menu-label mobile-menu-label-spaced">
                {t("Nav.story")}
              </span>
              <Link href="/story" className="mobile-menu-link">
                {t("Nav.story")}
              </Link>
              <Link href="/contact" className="mobile-menu-link">
                {t("Nav.contact")}
              </Link>
              {user ? (
                <Link href="/account/orders" className="mobile-menu-link">
                  {t("Nav.myOrders")}
                </Link>
              ) : null}
            </nav>

            <div className="mobile-menu-foot">
              <Link href={user ? "/account" : "/sign-in"}>
                {user ? t("Nav.account") : t("Auth.signIn")}
              </Link>
              <Link href={pathname} locale={otherLocale}>
                {t("Header.language")}
              </Link>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="search-overlay" />
          <Dialog.Content className="search-panel" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">
              {t("Header.search")}
            </Dialog.Title>
            <form className="search-form" onSubmit={submitSearch}>
              <Search size={22} strokeWidth={1.4} aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Header.searchPlaceholder")}
                aria-label={t("Header.search")}
                // biome-ignore lint/a11y/noAutofocus: the search field is the only control in the dialog
                autoFocus
              />
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="button-icon"
                  aria-label={t("Header.close")}
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </form>
            <p className="search-hint">{t("Header.searchHint")}</p>
            <div className="search-links">
              {searchItems.map((item) => (
                <Dialog.Close asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="search-link"
                    onClick={() => setSearchOpen(false)}
                  >
                    {item.label}
                  </Link>
                </Dialog.Close>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
