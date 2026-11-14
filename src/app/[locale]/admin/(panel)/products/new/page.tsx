import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductForm } from "@/components/admin/product-form";
import { getCategoriesForAdmin } from "@/lib/catalog";

export default async function NewProductPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/products/new">) {
  const [{ locale }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("Admin"),
  ]);
  setRequestLocale(locale);

  const categories = await getCategoriesForAdmin();

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("addProduct")}</h1>
      </header>
      <div className="admin-content">
        <section className="admin-card">
          <ProductForm
            product={null}
            categories={categories}
            locale={locale}
            error={query.error ? String(query.error) : undefined}
          />
        </section>
      </div>
    </>
  );
}
