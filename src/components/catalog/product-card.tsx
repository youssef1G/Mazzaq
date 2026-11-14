import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { QuickAdd } from "@/components/cart/quick-add";
import { Link } from "@/i18n/navigation";
import {
  type CatalogProduct,
  lowestPrice,
  productImageAlt,
  productName,
  variantName,
} from "@/lib/catalog-types";
import { formatMoney } from "@/lib/money";

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const defaultVariant =
    product.variants.find((variant) => variant.isDefault) ??
    product.variants[0];
  const price = lowestPrice(product);
  const hasMultiplePrices =
    new Set(product.variants.map((variant) => variant.price)).size > 1;
  const soldOut = product.variants.every(
    (variant) => variant.trackInventory && variant.stock <= 0,
  );

  return (
    <article className="product-card" data-reveal>
      <div className="product-media">
        <Link
          href={`/shop/${product.slug}`}
          aria-label={productName(product, locale)}
        >
          <Image
            src={product.imageUrl}
            alt={productImageAlt(product, locale)}
            fill
            priority={priority}
            sizes="(max-width: 560px) 100vw, (max-width: 1000px) 50vw, 33vw"
          />
        </Link>
        {product.isFeatured ? (
          <span className="product-badge">{t("inStock")}</span>
        ) : null}
        {soldOut ? <span className="product-badge">{t("soldOut")}</span> : null}
        {!soldOut ? <QuickAdd product={product} /> : null}
      </div>
      <div className="product-info">
        <div>
          <Link href={`/shop/${product.slug}`}>
            <h3 className="product-name">{productName(product, locale)}</h3>
          </Link>
          <p className="product-category">
            {defaultVariant
              ? variantName(defaultVariant, locale)
              : product.categoryNameEn}
          </p>
        </div>
        <div className="product-price">
          {hasMultiplePrices ? (
            <span>
              {t("from")} {formatMoney(price, locale)}
            </span>
          ) : (
            formatMoney(price, locale)
          )}
          {defaultVariant?.compareAtPrice ? (
            <s>{formatMoney(defaultVariant.compareAtPrice, locale)}</s>
          ) : null}
        </div>
      </div>
    </article>
  );
}
