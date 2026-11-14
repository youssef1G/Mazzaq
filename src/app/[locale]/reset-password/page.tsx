import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ResetPasswordPage({
  params,
  searchParams,
}: PageProps<"/[locale]/reset-password">) {
  const [{ locale }, t, query] = await Promise.all([
    params,
    getTranslations("Auth"),
    searchParams,
  ]);
  setRequestLocale(locale);
  const token = typeof query.token === "string" ? query.token : "";

  return (
    <AuthShell
      eyebrow={t("resetTitle")}
      title={t("resetTitle")}
      lead={t("resetLead")}
      footer={<Link href="/sign-in">{t("backToSignIn")}</Link>}
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="form-error">{t("error")}</p>
      )}
    </AuthShell>
  );
}
