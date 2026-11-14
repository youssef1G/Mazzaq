import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignUpForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-up">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("signUpTitle") };
}

export default async function SignUpPage({
  params,
}: PageProps<"/[locale]/sign-up">) {
  const [{ locale }, t] = await Promise.all([params, getTranslations("Auth")]);
  setRequestLocale(locale);
  const session = await getSession();
  if (session?.user) redirect(`/${locale}/account`);

  return (
    <AuthShell
      eyebrow={t("signUp")}
      title={t("signUpTitle")}
      lead={t("signUpLead")}
      footer={
        <>
          {t("haveAccount")} <Link href="/sign-in">{t("signIn")}</Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
