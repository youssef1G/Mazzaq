import "server-only";

import { locale } from "next/root-params";
import { isLocale, type Locale, routing } from "@/i18n/routing";

export async function getLocale(): Promise<Locale> {
  const value = await locale();
  return isLocale(value) ? value : routing.defaultLocale;
}
