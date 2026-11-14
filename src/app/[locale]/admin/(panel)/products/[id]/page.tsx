import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { deleteProduct } from "@/actions/admin";
import { ConfirmButton } from "@/components/account/confirm-button";
import { ProductForm } from "@/components/admin/product-form";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { getCategoriesForAdmin, mapProduct } from "@/lib/catalog";

export default async function EditProductPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/products/[id]">) {
  const [{ locale, id }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("Admin"),
  ]);
  setRequestLocale(locale);

  const db = await getDb();
  const [row, categories] = await Promise.all([
    db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
        images: true,
        variants: true,
      },
    }),
    getCategoriesForAdmin(),
  ]);
  if (!row) notFound();

  const product = mapProduct(row);

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("editProduct")}</h1>
        <div className="admin-topbar-actions">
          <form action={deleteProduct}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={id} />
            <ConfirmButton
              danger
              message={t("deleteConfirm")}
              className="button button-small button-secondary"
            >
              {t("deleteProduct")}
            </ConfirmButton>
          </form>
        </div>
      </header>

      <div className="admin-content">
        <section className="admin-card">
          <ProductForm
            product={product}
            categories={categories}
            locale={locale}
            error={query.error ? String(query.error) : undefined}
          />
        </section>
      </div>
    </>
  );
}
