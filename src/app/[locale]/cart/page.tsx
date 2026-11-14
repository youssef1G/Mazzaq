import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartPageContent } from "@/components/cart/cart-page-content";
import { getDeliverySettings } from "@/lib/settings";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cart">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("cartTitle") };
}

export default async function CartPage({
  params,
}: PageProps<"/[locale]/cart">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const delivery = await getDeliverySettings();

  return (
    <CartPageContent freeDeliveryThreshold={delivery.freeDeliveryThreshold} />
  );
}
