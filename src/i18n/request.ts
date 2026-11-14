import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { type Locale, routing } from "./routing";

export default getRequestConfig(
  async ({ locale: explicitLocale, requestLocale }) => {
    const requested = explicitLocale ?? (await requestLocale);
    const locale: Locale = hasLocale(routing.locales, requested)
      ? requested
      : routing.defaultLocale;

    return {
      locale,
      timeZone: "Africa/Cairo",
      now: new Date(),
      messages: (await import(`../../messages/${locale}.json`)).default,
      formats: {
        number: {
          currency: {
            style: "currency",
            currency: "EGP",
            maximumFractionDigits: 0,
          },
        },
      },
    };
  },
);
