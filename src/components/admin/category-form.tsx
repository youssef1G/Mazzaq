import { getTranslations } from "next-intl/server";
import { saveCategory } from "@/actions/admin";
import { ImageUpload } from "@/components/admin/image-upload";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string | null;
  isActive: boolean;
};

export async function CategoryForm({
  category,
  locale,
  error,
}: {
  category: Category | null;
  locale: string;
  error?: string;
}) {
  const t = await getTranslations("Admin");

  return (
    <form action={saveCategory} className="admin-form">
      <input type="hidden" name="locale" value={locale} />
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      {error === "slug" ? (
        <p className="form-error">{t("errorCategorySlug")}</p>
      ) : error ? (
        <p className="form-error">{t("errorRequired")}</p>
      ) : null}

      <div className="admin-form-grid">
        <div className="field">
          <label htmlFor="nameEn">{t("nameEn")}</label>
          <input
            id="nameEn"
            name="nameEn"
            className="input"
            required
            defaultValue={category?.nameEn ?? ""}
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
            defaultValue={category?.nameAr ?? ""}
          />
        </div>
      </div>

      <p className="admin-section-title">{t("categoryImage")}</p>
      <ImageUpload
        name="imageUrl"
        value={category?.imageUrl}
        label={t("categoryImage")}
      />

      <div className="checkbox-row">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          defaultChecked={category ? category.isActive : true}
        />
        <label htmlFor="isActive">{t("categoryActive")}</label>
      </div>

      <div>
        <button type="submit" className="button">
          {category ? t("saveCategory") : t("createCategory")}
        </button>
      </div>
    </form>
  );
}
