import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({
  params,
}: PageProps<"/[locale]/forgot-password">) {
  const [{ locale }, t] = await Promise.all([params, getTranslations("Auth")]);
  setRequestLocale(locale);

  return (
    <AuthShell
      eyebrow={t("forgot")}
      title={t("forgotTitle")}
      lead={t("forgotLead")}
      footer={<Link href="/sign-in">{t("backToSignIn")}</Link>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
