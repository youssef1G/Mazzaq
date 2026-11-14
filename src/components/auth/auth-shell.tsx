import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export async function AuthShell({
  eyebrow,
  title,
  lead,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [t, brand] = await Promise.all([
    getTranslations("Auth"),
    getTranslations("Brand"),
  ]);

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link href="/" aria-label={t("backToSignIn")}>
          <Image
            src="/images/brand/logo-512.png"
            alt="Mazzaق"
            width={104}
            height={104}
            className="brand-logo"
          />
        </Link>
        <div>
          <h2>{brand("tagline")}</h2>
          <p>{t("signInLead")}</p>
        </div>
        <span className="auth-aside-foot">{brand("est")}</span>
      </aside>
      <div className="auth-main">
        <div className="auth-card">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
          {children}
          {footer ? <div className="auth-switch">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
