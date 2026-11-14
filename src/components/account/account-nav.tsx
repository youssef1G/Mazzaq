"use client";

import {
  LayoutDashboard,
  MapPin,
  Package,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { SignOutButton } from "./sign-out-button";

const items = [
  { href: "/account", key: "overview", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", key: "orders", icon: Package, exact: false },
  { href: "/account/addresses", key: "addresses", icon: MapPin, exact: false },
  { href: "/account/profile", key: "profile", icon: UserRound, exact: false },
] as const;

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("Account");
  const pathname = usePathname();

  return (
    <nav className="account-nav" aria-label={t("title")}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="account-nav-link"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={14} strokeWidth={1.6} aria-hidden />
            {t(item.key)}
          </Link>
        );
      })}
      {isAdmin ? (
        <Link href="/admin" className="account-nav-link">
          <ShieldCheck size={14} strokeWidth={1.6} aria-hidden />
          {t("admin")}
        </Link>
      ) : null}
      <SignOutButton className="account-signout">{t("signOut")}</SignOutButton>
    </nav>
  );
}
