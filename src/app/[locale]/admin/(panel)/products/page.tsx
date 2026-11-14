import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllProductsForAdmin } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export default async function AdminProductsPage({
  params,
}: PageProps<"/[locale]/admin/products">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, products] = await Promise.all([
    getTranslations("Admin"),
    getAllProductsForAdmin(),
  ]);

  return (
    <>
      <header className="admin-topbar">
        <h1>{t("productsTitle")}</h1>
        <div className="admin-topbar-actions">
          <Link href="/admin/products/new" className="button button-small">
            {t("addProduct")}
          </Link>
        </div>
      </header>

      <div className="admin-content">
        <section className="admin-card">
          {products.length === 0 ? (
            <p className="muted small">{t("noData")}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th />
                    <th>{t("nameEn")}</th>
                    <th>{t("category")}</th>
                    <th>{t("price")}</th>
                    <th>{t("stock")}</th>
                    <th>{t("productActive")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const stock = product.variants.reduce(
                      (sum, variant) => sum + variant.stock,
                      0,
                    );
                    return (
                      <tr key={product.id}>
                        <td>
                          {/* biome-ignore lint/performance/noImgElement: small admin thumbnail */}
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="admin-thumb"
                          />
                        </td>
                        <td>
                          <Link href={`/admin/products/${product.id}`}>
                            {locale === "ar" ? product.nameAr : product.nameEn}
                          </Link>
                        </td>
                        <td>
                          {locale === "ar"
                            ? product.categoryNameAr
                            : product.categoryNameEn}
                        </td>
                        <td className="num">
                          {formatMoney(product.basePrice, locale)}
                        </td>
                        <td className="num">
                          {stock}
                          <span className="muted small">
                            {" "}
                            · {product.variants.length}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge"
                            data-tone={product.isActive ? "green" : "muted"}
                          >
                            {product.isActive ? t("productActive") : "—"}
                          </span>
                          {product.isFeatured ? (
                            <span className="badge" data-tone="amber">
                              {t("featured")}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <Link href={`/admin/products/${product.id}`}>
                            {t("editProduct")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
