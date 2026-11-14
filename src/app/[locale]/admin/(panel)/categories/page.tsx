import { asc, eq, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { deleteCategory } from "@/actions/admin";
import { ConfirmButton } from "@/components/account/confirm-button";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { Link } from "@/i18n/navigation";

export default async function AdminCategoriesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/categories">) {
  const [{ locale }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("Admin"),
  ]);
  setRequestLocale(locale);

  const db = await getDb();
  const rows = await db.query.categories.findMany({
    orderBy: [asc(categories.nameEn)],
  });
  const counts = await db
    .select({
      categoryId: products.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .groupBy(products.categoryId);
  const countMap = new Map(counts.map((row) => [row.categoryId, row.count]));

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("categoriesTitle")}</h1>
        <div className="admin-topbar-actions">
          <Link href="/admin/categories/new" className="button button-small">
            {t("addCategory")}
          </Link>
        </div>
      </header>

      <div className="admin-content">
        {query.saved ? (
          <p className="form-success">{t("categorySaved")}</p>
        ) : null}
        {query.deleted ? (
          <p className="form-success">{t("categoryDeleted")}</p>
        ) : null}

        <section className="admin-card">
          {rows.length === 0 ? (
            <p className="muted small">{t("noCategories")}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th />
                    <th>{t("nameEn")}</th>
                    <th>{t("productsTitle")}</th>
                    <th>{t("categoryActive")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((category) => (
                    <tr key={category.id}>
                      <td>
                        {/* biome-ignore lint/performance/noImgElement: small admin thumbnail */}
                        <img
                          src={category.imageUrl ?? "/images/placeholder.svg"}
                          alt=""
                          className="admin-thumb"
                        />
                      </td>
                      <td>
                        <Link href={`/admin/categories/${category.id}`}>
                          {locale === "ar" ? category.nameAr : category.nameEn}
                        </Link>
                        <br />
                        <span className="muted small">
                          {locale === "ar" ? category.nameEn : category.nameAr}
                        </span>
                      </td>
                      <td className="num">{countMap.get(category.id) ?? 0}</td>
                      <td>
                        <span
                          className="badge"
                          data-tone={category.isActive ? "green" : "muted"}
                        >
                          {category.isActive ? t("categoryActive") : "—"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link href={`/admin/categories/${category.id}`}>
                            {t("editCategory")}
                          </Link>
                          <form action={deleteCategory}>
                            <input type="hidden" name="locale" value={locale} />
                            <input
                              type="hidden"
                              name="id"
                              value={category.id}
                            />
                            <ConfirmButton
                              danger
                              message={t("deleteCategoryConfirm")}
                              className="drawer-remove"
                            >
                              {t("deleteCategory")}
                            </ConfirmButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
