import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignInForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("signInTitle") };
}

export default async function SignInPage({
  params,
}: PageProps<"/[locale]/sign-in">) {
  const [{ locale }, t] = await Promise.all([params, getTranslations("Auth")]);
  setRequestLocale(locale);
  const session = await getSession();
  if (session?.user) redirect(`/${locale}/account`);

  return (
    <AuthShell
      eyebrow={t("signIn")}
      title={t("signInTitle")}
      lead={t("signInLead")}
      footer={
        <>
          {t("noAccount")} <Link href="/sign-up">{t("signUp")}</Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
