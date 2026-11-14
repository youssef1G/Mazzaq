"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";

export function ImageUpload({
  name,
  value,
  label,
  onChange,
}: {
  name: string;
  value?: string | null;
  label: string;
  onChange?: (url: string) => void;
}) {
  const t = useTranslations("Admin");
  const [url, setUrl] = useState(value ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function choose(file: File | null) {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const next = await uploadImage(file);
      setUrl(next);
      onChange?.(next);
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

  function clear() {
    setUrl("");
    onChange?.("");
  }

  return (
    <div className="image-upload">
      <span className="field-label">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="image-upload-preview">
        {url ? (
          <Image src={url} alt="" fill sizes="180px" />
        ) : (
          <div className="image-upload-empty">
            <ImagePlus size={20} strokeWidth={1.5} aria-hidden />
            <span>{t("noImage")}</span>
          </div>
        )}
      </div>
      <div className="image-upload-actions">
        <button
          type="button"
          className="button button-small"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          {pending ? <Loader2 size={13} className="spin" /> : null}
          {url ? t("changeImage") : t("chooseImage")}
        </button>
        {url ? (
          <button
            type="button"
            className="button button-small button-secondary"
            onClick={clear}
          >
            {t("removeImage")}
          </button>
        ) : null}
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          void choose(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
    </div>
  );
}
