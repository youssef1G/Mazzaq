export function formatMoney(piastres: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(piastres / 100);
}

export function formatMoneyShort(piastres: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(piastres / 100);
}

export function formatDate(
  date: Date | string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    ...options,
    timeZone: "Africa/Cairo",
  }).format(value);
}

export function formatDateTime(date: Date | string, locale: string): string {
  return formatDate(date, locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSlotDate(date: string, locale: string): string {
  return formatDate(`${date}T12:00:00+02:00`, locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
