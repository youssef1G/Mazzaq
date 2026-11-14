import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { deleteCategory } from "@/actions/admin";
import { ConfirmButton } from "@/components/account/confirm-button";
import { CategoryForm } from "@/components/admin/category-form";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { Link } from "@/i18n/navigation";

export default async function EditCategoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/categories/[id]">) {
  const [{ locale, id }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("Admin"),
  ]);
  setRequestLocale(locale);

  const db = await getDb();
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
  if (!category) notFound();

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("editCategory")}</h1>
        <div className="admin-topbar-actions">
          <Link href="/admin/categories" className="text-link">
            {t("backToCategories")}
          </Link>
          <form action={deleteCategory}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={id} />
            <ConfirmButton
              danger
              message={t("deleteCategoryConfirm")}
              className="button button-small button-secondary"
            >
              {t("deleteCategory")}
            </ConfirmButton>
          </form>
        </div>
      </header>

      <div className="admin-content">
        {query.error === "products" ? (
          <p className="form-error">{t("categoryHasProducts")}</p>
        ) : null}
        <section className="admin-card">
          <CategoryForm
            category={category}
            locale={locale}
            error={query.error ? String(query.error) : undefined}
          />
        </section>
      </div>
    </>
  );
}
