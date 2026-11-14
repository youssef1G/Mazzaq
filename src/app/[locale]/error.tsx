"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Route-level error boundary for everything under [locale]. Keeps the
 * storefront shell (header/footer/cart) alive and offers a way out instead
 * of the generic Next.js crash screen.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");

  useEffect(() => {
    console.error("Unhandled route error", error);
  }, [error]);

  return (
    <div className="shell empty-state">
      <span className="empty-mark" aria-hidden>
        ✳
      </span>
      <h2>{t("serverTitle")}</h2>
      <p>{t("serverLead")}</p>
      {error.digest ? (
        <p className="muted small" dir="ltr">
          {t("errorReference")} {error.digest}
        </p>
      ) : null}
      <div className="empty-state-actions">
        <button type="button" className="button" onClick={reset}>
          {t("serverCta")}
        </button>
        <Link href="/" className="text-link">
          {t("notFoundCta")}
        </Link>
      </div>
    </div>
  );
}
