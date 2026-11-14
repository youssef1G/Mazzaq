"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type CategoryWithCount, categoryName } from "@/lib/catalog-types";

const sortOptions = ["price-asc", "price-desc", "newest"] as const;

export function ShopTools({
  categories,
  category,
  query,
  sort,
  locale,
}: {
  categories: CategoryWithCount[];
  category?: string;
  query?: string;
  sort?: string;
  locale: string;
}) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const pathname = usePathname();
  const [term, setTerm] = useState(query ?? "");

  useEffect(() => {
    setTerm(query ?? "");
  }, [query]);

  function push(params: URLSearchParams) {
    const suffix = params.toString();
    router.push(`${pathname}${suffix ? `?${suffix}` : ""}`);
  }

  function go(next: { q?: string; category?: string }) {
    const params = new URLSearchParams();
    const nextQuery = next.q ?? term;
    const nextCategory = next.category ?? category;
    if (nextQuery) params.set("q", nextQuery);
    if (nextCategory) params.set("category", nextCategory);
    if (sort) params.set("sort", sort);
    push(params);
  }

  function goSort(next: string) {
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    if (category) params.set("category", category);
    if (next) params.set("sort", next);
    push(params);
  }

  return (
    <div className="shop-toolbar">
      <div className="filter-chips">
        <button
          type="button"
          className="filter-chip"
          data-active={!category}
          onClick={() => go({ category: "" })}
        >
          {t("all")}
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className="filter-chip"
            data-active={category === item.slug}
            onClick={() => go({ category: item.slug })}
          >
            {categoryName(item, locale)}
          </button>
        ))}
      </div>

      <div className="toolbar-end">
        <DropdownSelect
          compact
          defaultValue={sort ?? ""}
          label={t("sortLabel")}
          options={[
            { value: "", label: t("sortDefault") },
            ...sortOptions.map((value) => ({
              value,
              label:
                value === "price-asc"
                  ? t("sortPriceAsc")
                  : value === "price-desc"
                    ? t("sortPriceDesc")
                    : t("sortNewest"),
            })),
          ]}
          onValueChange={goSort}
        />
        <form
          className="shop-search"
          onSubmit={(event) => {
            event.preventDefault();
            go({ q: term.trim() });
          }}
        >
          <Search size={14} strokeWidth={1.6} aria-hidden />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
          />
        </form>
      </div>
    </div>
  );
}
