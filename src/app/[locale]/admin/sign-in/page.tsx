import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminSignInForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/sign-in">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("adminSignInTitle") };
}

export default async function AdminSignInPage({
  params,
}: PageProps<"/[locale]/admin/sign-in">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (session?.user?.role === "admin") redirect(`/${locale}/admin`);

  const t = await getTranslations("Auth");

  return (
    <AuthShell
      eyebrow={t("adminSignIn")}
      title={t("adminSignInTitle")}
      lead={t("adminSignInLead")}
      footer={
        <>
          {t("notAdmin")} <Link href="/sign-in">{t("customerSignIn")}</Link>
        </>
      }
    >
      <AdminSignInForm />
    </AuthShell>
  );
}
