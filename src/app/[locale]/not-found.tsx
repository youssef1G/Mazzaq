import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function LocaleNotFound() {
  const t = useTranslations("Errors");

  return (
    <div className="shell empty-state">
      <span className="empty-mark" aria-hidden>
        ✳
      </span>
      <h2>{t("notFoundTitle")}</h2>
      <p>{t("notFoundLead")}</p>
      <Link href="/shop" className="button">
        {t("notFoundCta")}
      </Link>
    </div>
  );
}
