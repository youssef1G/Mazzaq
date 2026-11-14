import { getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryForm } from "@/components/admin/category-form";

export default async function NewCategoryPage({
  params,
}: PageProps<"/[locale]/admin/categories/new">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin");

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("addCategory")}</h1>
      </header>
      <div className="admin-content">
        <section className="admin-card">
          <CategoryForm category={null} locale={locale} />
        </section>
      </div>
    </>
  );
}
