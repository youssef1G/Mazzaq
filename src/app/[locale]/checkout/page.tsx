import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getSession } from "@/lib/session";
import { getDeliverySettings, getStoreSettings } from "@/lib/settings";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("checkoutTitle") };
}

export default async function CheckoutPage({
  params,
}: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [store, delivery, session] = await Promise.all([
    getStoreSettings(),
    getDeliverySettings(),
    getSession(),
  ]);

  return (
    <CheckoutForm
      store={store}
      deliveryFee={delivery.deliveryFee}
      freeDeliveryThreshold={delivery.freeDeliveryThreshold}
      user={
        session?.user
          ? { name: session.user.name, email: session.user.email }
          : null
      }
    />
  );
}
