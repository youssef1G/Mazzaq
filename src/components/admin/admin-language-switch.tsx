"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function AdminLanguageSwitch() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const pathname = usePathname();
  const otherLocale = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={pathname}
      locale={otherLocale}
      className="admin-nav-link"
      aria-label={t("languageButtonLabel")}
    >
      <Languages size={14} strokeWidth={1.6} aria-hidden />
      {t("languageButton")}
    </Link>
  );
}
