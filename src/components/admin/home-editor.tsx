"use client";

import {
  ArrowRight,
  Check,
  ExternalLink,
  Lock,
  Menu,
  MousePointerClick,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { saveHomeSettings } from "@/actions/admin";
import { ImageUpload } from "@/components/admin/image-upload";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { Link } from "@/i18n/navigation";
import type { HomeSettings } from "@/lib/settings-schema";

type GallerySlot = HomeSettings["gallery"][number] & { key: string };
type Selection =
  | "hero-image"
  | "hero-title"
  | "hero-lead"
  | "gallery-head"
  | "frame-0"
  | "frame-1"
  | "frame-2"
  | "frame-3"
  | "frame-4"
  | "frame-5"
  | "cta"
  | null;

function DualField({
  label,
  enValue,
  arValue,
  onEn,
  onAr,
  multiline = false,
}: {
  label: string;
  enValue: string;
  arValue: string;
  onEn: (value: string) => void;
  onAr: (value: string) => void;
  multiline?: boolean;
}) {
  const rawId = useId();
  const enId = `hp-${rawId}-en`;
  const arId = `hp-${rawId}-ar`;
  const enControl = multiline ? (
    <textarea
      id={enId}
      className="textarea"
      value={enValue}
      onChange={(event) => onEn(event.target.value)}
    />
  ) : (
    <input
      id={enId}
      className="input"
      value={enValue}
      onChange={(event) => onEn(event.target.value)}
    />
  );
  const arControl = multiline ? (
    <textarea
      id={arId}
      className="textarea"
      dir="rtl"
      value={arValue}
      onChange={(event) => onAr(event.target.value)}
    />
  ) : (
    <input
      id={arId}
      className="input"
      dir="rtl"
      value={arValue}
      onChange={(event) => onAr(event.target.value)}
    />
  );
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="hp-dual">
        <label className="hp-lang-field" htmlFor={enId}>
          <span>EN</span>
          {enControl}
        </label>
        <label className="hp-lang-field" htmlFor={arId}>
          <span>AR</span>
          {arControl}
        </label>
      </div>
    </div>
  );
}

function Hot({
  id,
  selected,
  onSelect,
  label,
  className,
  children,
}: {
  id: Selection & string;
  selected: Selection;
  onSelect: (id: Selection) => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const isSelected = selected === id;
  return (
    <button
      type="button"
      className={className ? `hp-hot ${className}` : "hp-hot"}
      data-selected={isSelected || undefined}
      onClick={() => onSelect(isSelected ? null : id)}
      aria-pressed={isSelected}
      aria-label={label}
    >
      {children}
      {isSelected ? <span className="hp-chip">{label}</span> : null}
    </button>
  );
}

export function HomeEditor({ initial }: { initial: HomeSettings }) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const ar = locale === "ar";
  const pick = (en: string, valueAr: string) => (ar ? valueAr : en);

  const [values, setValues] = useState(() => ({
    ...initial,
    gallery: initial.gallery.map(
      (item, index): GallerySlot => ({
        ...item,
        key: `${index}-${item.src}`,
      }),
    ),
  }));
  const [selected, setSelected] = useState<Selection>("hero-title");

  function set(key: keyof HomeSettings, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function setGallery(index: number, patch: Partial<GallerySlot>) {
    setValues((current) => ({
      ...current,
      gallery: current.gallery.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  const selectedFrame = selected?.startsWith("frame-")
    ? Number(selected.slice(6))
    : null;
  const frameItem =
    selectedFrame !== null ? values.gallery[selectedFrame] : undefined;

  const hiddenFields: Array<[string, string]> = [
    ["heroImage", values.heroImage],
    ["heroTitleAEn", values.heroTitleAEn],
    ["heroTitleAAr", values.heroTitleAAr],
    ["heroTitleEmEn", values.heroTitleEmEn],
    ["heroTitleEmAr", values.heroTitleEmAr],
    ["heroTitleBEn", values.heroTitleBEn],
    ["heroTitleBAr", values.heroTitleBAr],
    ["heroLeadEn", values.heroLeadEn],
    ["heroLeadAr", values.heroLeadAr],
    ["galleryTitleEn", values.galleryTitleEn],
    ["galleryTitleAr", values.galleryTitleAr],
    ["galleryLeadEn", values.galleryLeadEn],
    ["galleryLeadAr", values.galleryLeadAr],
    ["ctaTitleEn", values.ctaTitleEn],
    ["ctaTitleAr", values.ctaTitleAr],
    ["ctaLeadEn", values.ctaLeadEn],
    ["ctaLeadAr", values.ctaLeadAr],
    ["ctaButtonEn", values.ctaButtonEn],
    ["ctaButtonAr", values.ctaButtonAr],
    ...values.gallery.flatMap(
      (item, index): Array<[string, string]> => [
        [`galleryImage${index}`, item.src],
        [`galleryShape${index}`, item.shape],
        [`galleryCaptionEn${index}`, item.captionEn],
        [`galleryCaptionAr${index}`, item.captionAr],
      ],
    ),
  ];

  const frameChip =
    selectedFrame !== null ? t("frame", { n: selectedFrame + 1 }) : "";

  const panelTitle =
    selected === "hero-image"
      ? t("heroImage")
      : selected === "hero-title"
        ? t("heroCopy")
        : selected === "hero-lead"
          ? t("heroLead")
          : selected === "gallery-head"
            ? t("galleryCopy")
            : selected === "cta"
              ? t("ctaCopy")
              : frameChip;

  return (
    <form action={saveHomeSettings} className="hp-editor-layout">
      <input type="hidden" name="locale" value={locale} />
      {hiddenFields.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="hp-stage" dir={ar ? "rtl" : "ltr"}>
        <div className="hp-window">
          <div className="hp-chrome">
            <span className="hp-dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className="hp-url">
              <Lock size={9} strokeWidth={2} aria-hidden /> mazzaq.co/{locale}
            </span>
            <span className="hp-live">{t("homepagePreview")}</span>
          </div>

          <div className="hp-page">
            <div className="hp-nav" aria-hidden>
              <span className="hp-brand">
                <Image
                  src="/images/brand/logo-128.png"
                  alt=""
                  width={26}
                  height={26}
                />
                <span className="hp-brand-name">{ar ? "مزاق" : "Mazzaق"}</span>
              </span>
              <span className="hp-nav-links">
                <span>{ar ? "الفاترينة" : "SHOP"}</span>
                <span>{ar ? "قصتنا" : "OUR STORY"}</span>
                <span>{ar ? "تواصل" : "CONTACT"}</span>
              </span>
              <span className="hp-nav-icons">
                <Search size={11} strokeWidth={1.8} />
                <UserRound size={11} strokeWidth={1.8} />
                <ShoppingBag size={11} strokeWidth={1.8} />
                <Menu size={12} strokeWidth={1.8} />
              </span>
            </div>

            {/* Hero -------------------------------------------------- */}
            <div className="hp-hero">
              <div className="hp-hero-copy">
                <span className="hp-eyebrow">
                  {ar ? "باتيسيري مصري حديث" : "MODERN EGYPTIAN PATISSERIE"}
                </span>
                <Hot
                  id="hero-title"
                  selected={selected}
                  onSelect={setSelected}
                  label={t("heroCopy")}
                  className="hp-hot-block"
                >
                  <span className="hp-hero-title">
                    {pick(values.heroTitleAEn, values.heroTitleAAr)}
                    <br />
                    <em>{pick(values.heroTitleEmEn, values.heroTitleEmAr)}</em>{" "}
                    {pick(values.heroTitleBEn, values.heroTitleBAr)}
                  </span>
                </Hot>
                <Hot
                  id="hero-lead"
                  selected={selected}
                  onSelect={setSelected}
                  label={t("heroLead")}
                  className="hp-hot-block"
                >
                  <span className="hp-hero-lead">
                    {pick(values.heroLeadEn, values.heroLeadAr)}
                  </span>
                </Hot>
                <span className="hp-hero-cta">
                  {ar ? "استكشف الفاترينة" : "EXPLORE THE PASTRY CASE"}
                </span>
              </div>
              <Hot
                id="hero-image"
                selected={selected}
                onSelect={setSelected}
                label={t("heroImage")}
                className="hp-hero-media"
              >
                <Image src={values.heroImage} alt="" fill sizes="200px" />
              </Hot>
            </div>

            {/* Locked: the pastry case strip --------------------------- */}
            <div className="hp-locked">
              <span className="hp-locked-note">
                <Lock size={9} strokeWidth={2} aria-hidden />
                {t("lockedProducts")}
              </span>
              <Link href="/admin/products" className="hp-locked-link">
                {t("navProducts")}
                <ArrowRight size={9} strokeWidth={2} aria-hidden />
              </Link>
            </div>

            {/* Gallery ------------------------------------------------- */}
            <div className="hp-gallery">
              <Hot
                id="gallery-head"
                selected={selected}
                onSelect={setSelected}
                label={t("galleryCopy")}
                className="hp-hot-block"
              >
                <span className="hp-eyebrow">
                  {ar ? "من الأتيليه" : "FROM THE ATELIER"}
                </span>
                <span className="hp-gallery-title">
                  {pick(values.galleryTitleEn, values.galleryTitleAr)}
                </span>
                <span className="hp-gallery-lead">
                  {pick(values.galleryLeadEn, values.galleryLeadAr)}
                </span>
              </Hot>
              <div className="hp-wall">
                {values.gallery.map((item, index) => (
                  <Hot
                    key={item.key}
                    id={`frame-${index}` as Selection & string}
                    selected={selected}
                    onSelect={setSelected}
                    label={t("frame", { n: index + 1 })}
                    className={`hp-tile ${item.shape}`}
                  >
                    <Image src={item.src} alt="" fill sizes="140px" />
                    <span className="hp-tile-caption">
                      {pick(item.captionEn, item.captionAr)}
                    </span>
                  </Hot>
                ))}
              </div>
            </div>

            {/* Closing CTA --------------------------------------------- */}
            <Hot
              id="cta"
              selected={selected}
              onSelect={setSelected}
              label={t("ctaCopy")}
              className="hp-cta"
            >
              <span className="hp-cta-copy">
                <span className="hp-eyebrow">
                  {ar ? "جاهز عندما تكون أنت" : "READY WHEN YOU ARE"}
                </span>
                <span className="hp-cta-title">
                  {pick(values.ctaTitleEn, values.ctaTitleAr)}
                </span>
                <span className="hp-cta-lead">
                  {pick(values.ctaLeadEn, values.ctaLeadAr)}
                </span>
              </span>
              <span className="hp-cta-button">
                {pick(values.ctaButtonEn, values.ctaButtonAr)}
                <ArrowRight size={10} strokeWidth={2} aria-hidden />
              </span>
            </Hot>
          </div>
        </div>
        <p className="hp-hint">
          <MousePointerClick size={13} strokeWidth={1.6} aria-hidden />
          {t("previewHint")}
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Contextual editor panel                                              */}
      {/* ------------------------------------------------------------------ */}
      <aside className="hp-panel">
        <div className="hp-panel-head">
          <h3>{selected ? panelTitle : t("homepageTitle")}</h3>
          {selected ? (
            <button
              type="button"
              className="button-icon hp-panel-close"
              onClick={() => setSelected(null)}
              aria-label={t("close")}
            >
              <X size={16} strokeWidth={1.8} aria-hidden />
            </button>
          ) : null}
        </div>

        {selected === null ? (
          <div className="hp-panel-empty">
            <MousePointerClick size={22} strokeWidth={1.5} aria-hidden />
            <p>{t("previewHint")}</p>
          </div>
        ) : null}

        {selected === "hero-image" ? (
          <ImageUpload
            name="heroImage"
            value={values.heroImage}
            label={t("heroImage")}
            onChange={(url) => set("heroImage", url)}
          />
        ) : null}

        {selected === "hero-title" ? (
          <>
            <DualField
              label={t("heroTitleA")}
              enValue={values.heroTitleAEn}
              arValue={values.heroTitleAAr}
              onEn={(next) => set("heroTitleAEn", next)}
              onAr={(next) => set("heroTitleAAr", next)}
            />
            <DualField
              label={t("heroTitleEm")}
              enValue={values.heroTitleEmEn}
              arValue={values.heroTitleEmAr}
              onEn={(next) => set("heroTitleEmEn", next)}
              onAr={(next) => set("heroTitleEmAr", next)}
            />
            <DualField
              label={t("heroTitleB")}
              enValue={values.heroTitleBEn}
              arValue={values.heroTitleBAr}
              onEn={(next) => set("heroTitleBEn", next)}
              onAr={(next) => set("heroTitleBAr", next)}
            />
          </>
        ) : null}

        {selected === "hero-lead" ? (
          <DualField
            label={t("heroLead")}
            enValue={values.heroLeadEn}
            arValue={values.heroLeadAr}
            onEn={(next) => set("heroLeadEn", next)}
            onAr={(next) => set("heroLeadAr", next)}
            multiline
          />
        ) : null}

        {selected === "gallery-head" ? (
          <>
            <DualField
              label={t("galleryTitle")}
              enValue={values.galleryTitleEn}
              arValue={values.galleryTitleAr}
              onEn={(next) => set("galleryTitleEn", next)}
              onAr={(next) => set("galleryTitleAr", next)}
            />
            <DualField
              label={t("galleryLead")}
              enValue={values.galleryLeadEn}
              arValue={values.galleryLeadAr}
              onEn={(next) => set("galleryLeadEn", next)}
              onAr={(next) => set("galleryLeadAr", next)}
            />
          </>
        ) : null}

        {frameItem && selectedFrame !== null ? (
          <>
            <ImageUpload
              name={`galleryImage${selectedFrame}`}
              value={frameItem.src}
              label={t("galleryImage")}
              onChange={(url) => setGallery(selectedFrame, { src: url })}
            />
            <DualField
              label={t("captionLabel")}
              enValue={frameItem.captionEn}
              arValue={frameItem.captionAr}
              onEn={(next) => setGallery(selectedFrame, { captionEn: next })}
              onAr={(next) => setGallery(selectedFrame, { captionAr: next })}
            />
            <div className="field">
              <label htmlFor={`galleryShape${selectedFrame}`}>
                {t("shape")}
              </label>
              <DropdownSelect
                id={`galleryShape${selectedFrame}`}
                name={`galleryShape${selectedFrame}`}
                label={t("shape")}
                defaultValue={frameItem.shape}
                onValueChange={(next) =>
                  setGallery(selectedFrame, {
                    shape: next as GallerySlot["shape"],
                  })
                }
                options={[
                  { value: "is-tall", label: t("shapeTall") },
                  { value: "is-wide", label: t("shapeWide") },
                  { value: "is-square", label: t("shapeSquare") },
                ]}
              />
            </div>
          </>
        ) : null}

        {selected === "cta" ? (
          <>
            <DualField
              label={t("ctaTitle")}
              enValue={values.ctaTitleEn}
              arValue={values.ctaTitleAr}
              onEn={(next) => set("ctaTitleEn", next)}
              onAr={(next) => set("ctaTitleAr", next)}
            />
            <DualField
              label={t("ctaLead")}
              enValue={values.ctaLeadEn}
              arValue={values.ctaLeadAr}
              onEn={(next) => set("ctaLeadEn", next)}
              onAr={(next) => set("ctaLeadAr", next)}
              multiline
            />
            <DualField
              label={t("ctaButton")}
              enValue={values.ctaButtonEn}
              arValue={values.ctaButtonAr}
              onEn={(next) => set("ctaButtonEn", next)}
              onAr={(next) => set("ctaButtonAr", next)}
            />
          </>
        ) : null}

        <div className="hp-panel-actions">
          <button type="submit" className="button button-block">
            <Check size={15} strokeWidth={2} aria-hidden />
            {t("saveHomepage")}
          </button>
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="text-link hp-open-site"
          >
            <ExternalLink size={11} strokeWidth={1.8} aria-hidden />
            {t("previewSite")}
          </Link>
        </div>
      </aside>
    </form>
  );
}
