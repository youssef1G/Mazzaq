import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignOutButton } from "@/components/account/sign-out-button";
import { AdminLanguageSwitch } from "@/components/admin/admin-language-switch";
import { AdminNav } from "@/components/admin/admin-nav";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({
  children,
  params,
}: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, t, brandT] = await Promise.all([
    requireAdmin(locale),
    getTranslations("Admin"),
    getTranslations("Brand"),
  ]);
  const brandName = locale === "ar" ? brandT("nameAr") : brandT("name");

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Image
            src="/images/brand/logo-128.png"
            alt="Mazzaق"
            width={48}
            height={48}
            className="brand-logo"
            priority
          />
          <span className="brand-lockup">
            <span className="brand-mark">{brandName}</span>
            <span className="brand-sub">{t("title")}</span>
          </span>
        </div>

        <AdminNav />

        <div className="admin-sidebar-foot">
          <p className="admin-user">{session.user.name}</p>
          <Link href="/" className="admin-nav-link">
            <ArrowLeft size={14} strokeWidth={1.6} aria-hidden />
            {t("backToStore")}
          </Link>
          <SignOutButton className="admin-nav-link">
            {t("signOut")}
          </SignOutButton>
          <AdminLanguageSwitch />
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
