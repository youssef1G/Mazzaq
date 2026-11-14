"use client";

import {
  Croissant,
  LayoutDashboard,
  Mail,
  Settings,
  ShoppingBag,
  Tags,
  TicketPercent,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const items = [
  { href: "/admin", key: "navDashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", key: "navOrders", icon: ShoppingBag, exact: false },
  {
    href: "/admin/products",
    key: "navProducts",
    icon: Croissant,
    exact: false,
  },
  {
    href: "/admin/categories",
    key: "navCategories",
    icon: Tags,
    exact: false,
  },
  {
    href: "/admin/discounts",
    key: "navDiscounts",
    icon: TicketPercent,
    exact: false,
  },
  { href: "/admin/customers", key: "navCustomers", icon: Users, exact: false },
  { href: "/admin/settings", key: "navSettings", icon: Settings, exact: false },
  { href: "/admin/outbox", key: "navOutbox", icon: Mail, exact: false },
] as const;

export function AdminNav() {
  const t = useTranslations("Admin");
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label={t("title")}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="admin-nav-link"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={14} strokeWidth={1.6} aria-hidden />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
