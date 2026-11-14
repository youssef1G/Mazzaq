import { getTranslations } from "next-intl/server";
import { saveProduct } from "@/actions/admin";
import { ProductImagesField } from "@/components/admin/product-images-field";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import type { CatalogProduct } from "@/lib/catalog-types";

type Category = {
  id: string;
  nameEn: string;
  nameAr: string;
};

export async function ProductForm({
  product,
  categories,
  locale,
  error,
}: {
  product: CatalogProduct | null;
  categories: Category[];
  locale: string;
  error?: string;
}) {
  const t = await getTranslations("Admin");
  const variants = product?.variants ?? [];
  const defaultVariant =
    variants.find((variant) => variant.isDefault)?.id ?? "new";
  const images =
    product?.images && product.images.length > 0
      ? product.images
      : product?.imageUrl
        ? [
            {
              id: "legacy",
              url: product.imageUrl,
              altEn: product.imageAltEn,
              altAr: product.imageAltAr,
              sortOrder: 0,
              isPrimary: true,
            },
          ]
        : [];

  return (
    <form action={saveProduct} className="admin-form">
      <input type="hidden" name="locale" value={locale} />
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {error ? <p className="form-error">{t("errorRequired")}</p> : null}

      <p className="admin-section-title">{t("productDetails")}</p>
      <div className="admin-form-grid">
        <div className="field">
          <label htmlFor="nameEn">{t("nameEn")}</label>
          <input
            id="nameEn"
            name="nameEn"
            className="input"
            required
            defaultValue={product?.nameEn ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="nameAr">{t("nameAr")}</label>
          <input
            id="nameAr"
            name="nameAr"
            className="input"
            required
            dir="rtl"
            defaultValue={product?.nameAr ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="categoryId">{t("category")}</label>
          <DropdownSelect
            id="categoryId"
            name="categoryId"
            label={t("category")}
            defaultValue={product?.categoryId ?? categories[0]?.id ?? ""}
            options={categories.map((category) => ({
              value: category.id,
              label: locale === "ar" ? category.nameAr : category.nameEn,
            }))}
          />
        </div>
        <div className="field">
          <label htmlFor="basePrice">{t("price")}</label>
          <input
            id="basePrice"
            name="basePrice"
            className="input"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={product ? (product.basePrice / 100).toFixed(2) : ""}
          />
        </div>
        <div className="field">
          <label htmlFor="leadTimeHours">{t("productLeadTime")}</label>
          <input
            id="leadTimeHours"
            name="leadTimeHours"
            className="input"
            type="number"
            min={0}
            defaultValue={product?.leadTimeHours ?? 48}
          />
        </div>
        <div className="field span-2">
          <label htmlFor="shortDescriptionEn">{t("shortDescriptionEn")}</label>
          <input
            id="shortDescriptionEn"
            name="shortDescriptionEn"
            className="input"
            defaultValue={product?.shortDescriptionEn ?? ""}
          />
        </div>
        <div className="field span-2">
          <label htmlFor="shortDescriptionAr">{t("shortDescriptionAr")}</label>
          <input
            id="shortDescriptionAr"
            name="shortDescriptionAr"
            className="input"
            dir="rtl"
            defaultValue={product?.shortDescriptionAr ?? ""}
          />
        </div>
        <div className="field span-2">
          <label htmlFor="descriptionEn">{t("descriptionEn")}</label>
          <textarea
            id="descriptionEn"
            name="descriptionEn"
            className="textarea"
            defaultValue={product?.descriptionEn ?? ""}
          />
        </div>
        <div className="field span-2">
          <label htmlFor="descriptionAr">{t("descriptionAr")}</label>
          <textarea
            id="descriptionAr"
            name="descriptionAr"
            className="textarea"
            dir="rtl"
            defaultValue={product?.descriptionAr ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="servesEn">{t("servesEn")}</label>
          <input
            id="servesEn"
            name="servesEn"
            className="input"
            defaultValue={product?.servesEn ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="servesAr">{t("servesAr")}</label>
          <input
            id="servesAr"
            name="servesAr"
            className="input"
            dir="rtl"
            defaultValue={product?.servesAr ?? ""}
          />
        </div>
      </div>

      <p className="admin-section-title">{t("productImages")}</p>
      <p className="form-note">{t("slugAuto")}</p>
      <ProductImagesField images={images} locale={locale} />

      <div className="checkbox-row">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          defaultChecked={product ? product.isActive : true}
        />
        <label htmlFor="isActive">{t("productActive")}</label>
      </div>
      <div className="checkbox-row">
        <input
          type="checkbox"
          id="isFeatured"
          name="isFeatured"
          defaultChecked={product?.isFeatured ?? false}
        />
        <label htmlFor="isFeatured">{t("featured")}</label>
      </div>

      <p className="admin-section-title">{t("variants")}</p>
      <p className="form-note">{t("skuAuto")}</p>
      <div className="variant-editor">
        {variants.map((variant) => (
          <div className="variant-editor-row" key={variant.id}>
            <div className="field">
              <label htmlFor={`v-${variant.id}-nameEn`}>
                {t("variantNameEn")}
              </label>
              <input
                id={`v-${variant.id}-nameEn`}
                name={`v:${variant.id}:nameEn`}
                className="input"
                defaultValue={variant.nameEn}
              />
            </div>
            <div className="field">
              <label htmlFor={`v-${variant.id}-nameAr`}>
                {t("variantNameAr")}
              </label>
              <input
                id={`v-${variant.id}-nameAr`}
                name={`v:${variant.id}:nameAr`}
                className="input"
                dir="rtl"
                defaultValue={variant.nameAr}
              />
            </div>
            <div className="field">
              <label htmlFor={`v-${variant.id}-price`}>{t("price")}</label>
              <input
                id={`v-${variant.id}-price`}
                name={`v:${variant.id}:price`}
                className="input"
                type="number"
                min={0}
                step="0.01"
                defaultValue={(variant.price / 100).toFixed(2)}
              />
            </div>
            <div className="field">
              <label htmlFor={`v-${variant.id}-stock`}>{t("stock")}</label>
              <input
                id={`v-${variant.id}-stock`}
                name={`v:${variant.id}:stock`}
                className="input"
                type="number"
                min={0}
                defaultValue={variant.stock}
              />
            </div>
            <label className="checkbox-row">
              <input
                type="radio"
                name="defaultVariant"
                value={variant.id}
                defaultChecked={defaultVariant === variant.id}
              />
              <span>{t("defaultVariant")}</span>
            </label>
          </div>
        ))}

        <div className="variant-editor-row">
          <div className="field">
            <label htmlFor="v-new-nameEn">{t("variantNameEn")}</label>
            <input
              id="v-new-nameEn"
              name="v:new:nameEn"
              className="input"
              placeholder="6-inch"
            />
          </div>
          <div className="field">
            <label htmlFor="v-new-nameAr">{t("variantNameAr")}</label>
            <input
              id="v-new-nameAr"
              name="v:new:nameAr"
              className="input"
              dir="rtl"
              placeholder="٦ بوصة"
            />
          </div>
          <div className="field">
            <label htmlFor="v-new-price">{t("price")}</label>
            <input
              id="v-new-price"
              name="v:new:price"
              className="input"
              type="number"
              min={0}
              step="0.01"
            />
          </div>
          <div className="field">
            <label htmlFor="v-new-stock">{t("stock")}</label>
            <input
              id="v-new-stock"
              name="v:new:stock"
              className="input"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <label className="checkbox-row">
            <input
              type="radio"
              name="defaultVariant"
              value="new"
              defaultChecked={defaultVariant === "new"}
            />
            <span>{t("defaultVariant")}</span>
          </label>
        </div>
      </div>

      <div>
        <button type="submit" className="button">
          {product ? t("saveProduct") : t("createProduct")}
        </button>
      </div>
    </form>
  );
}
