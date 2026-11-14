"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";

type ImageItem = {
  url: string;
  altEn: string;
  altAr: string;
  isPrimary: boolean;
};

export function ProductImagesField({
  images,
  locale,
}: {
  images: ImageItem[];
  locale: string;
}) {
  const t = useTranslations("Admin");
  const [items, setItems] = useState<ImageItem[]>(images);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPending(true);
    setError(null);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadImage));
      setItems((current) => [
        ...current,
        ...urls.map((url, index) => ({
          url,
          altEn: "",
          altAr: "",
          isPrimary: current.length === 0 && index === 0,
        })),
      ]);
    } catch (uploadError) {
      setError(
        t(
          uploadError instanceof Error && uploadError.message === "size"
            ? "uploadTooLarge"
            : "uploadError",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  function update(index: number, patch: Partial<ImageItem>) {
    setItems((current) =>
      current.map((item, position) =>
        position === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function setPrimary(index: number) {
    setItems((current) =>
      current.map((item, position) => ({
        ...item,
        isPrimary: position === index,
      })),
    );
  }

  function remove(index: number) {
    setItems((current) => {
      const next = current.filter((_, position) => position !== index);
      if (current[index]?.isPrimary && next.length > 0) {
        const first = next[0];
        if (first) {
          next[0] = { ...first, isPrimary: true };
        }
      }
      return next;
    });
  }

  return (
    <div className="product-images-field">
      <span className="field-label">{t("productImages")}</span>
      <div className="product-images-grid">
        {items.map((item, index) => (
          <div className="product-image-card" key={`${item.url}-${index}`}>
            <div className="product-image-preview">
              <Image src={item.url} alt="" fill sizes="150px" />
            </div>
            <input type="hidden" name={`image:${index}:url`} value={item.url} />
            <input
              type="hidden"
              name={`image:${index}:altEn`}
              value={item.altEn}
            />
            <input
              type="hidden"
              name={`image:${index}:altAr`}
              value={item.altAr}
            />
            <input
              type="hidden"
              name={`image:${index}:primary`}
              value={item.isPrimary ? "1" : "0"}
            />
            <div className="product-image-fields">
              <input
                value={item.altEn}
                onChange={(event) =>
                  update(index, { altEn: event.target.value })
                }
                placeholder={t("imageAltEn")}
                aria-label={t("imageAltEn")}
              />
              <input
                value={item.altAr}
                onChange={(event) =>
                  update(index, { altAr: event.target.value })
                }
                placeholder={t("imageAltAr")}
                aria-label={t("imageAltAr")}
                dir="rtl"
              />
            </div>
            <div className="product-image-actions">
              <label className="checkbox-row">
                <input
                  type="radio"
                  name="primaryImage"
                  checked={item.isPrimary}
                  onChange={() => setPrimary(index)}
                />
                <span>{t("primaryImage")}</span>
              </label>
              <button
                type="button"
                className="drawer-remove"
                onClick={() => remove(index)}
              >
                {t("removeImage")}
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="product-image-add"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          {pending ? (
            <Loader2 size={18} className="spin" aria-hidden />
          ) : (
            <ImagePlus size={18} strokeWidth={1.5} aria-hidden />
          )}
          <span>{t("addImage")}</span>
        </button>
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => {
          void add(event.target.files);
          event.target.value = "";
        }}
      />
      <span className="form-note">
        {locale === "ar"
          ? "الصورة الأساسية تظهر في الفاترينة والنتائج."
          : "The primary image is the one shown in the pastry case and search results."}
      </span>
    </div>
  );
}
