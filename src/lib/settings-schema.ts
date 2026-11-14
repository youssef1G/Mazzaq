import { z } from "zod";

export const deliveryWindowSchema = z.object({
  key: z.string().min(1),
  labelEn: z.string().min(1),
  labelAr: z.string().min(1),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export type DeliveryWindow = z.infer<typeof deliveryWindowSchema>;

/**
 * The store settings that are actually wired into the storefront: the contact
 * details shown in the footer and on the contact page, plus the InstaPay
 * handle used at checkout. Name and tagline live in the message dictionaries.
 */
export const storeSettingsSchema = z.object({
  phone: z.string().min(1),
  whatsapp: z.string().min(1),
  email: z.string().email(),
  addressEn: z.string().min(1),
  addressAr: z.string().min(1),
  instapayHandle: z.string().min(1),
  instagram: z.string().min(1),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

export const deliverySettingsSchema = z.object({
  deliveryFee: z.number().int().min(0),
  freeDeliveryThreshold: z.number().int().min(0),
  deliveryLeadTimeHours: z.number().int().min(0),
  capacity: z.number().int().min(1),
  timezone: z.string().min(1),
  deliveryAreas: z.array(z.string().min(1)),
  deliveryWindows: z.array(deliveryWindowSchema).min(1),
});

export type DeliverySettings = z.infer<typeof deliverySettingsSchema>;

export const homeGallerySchema = z.object({
  src: z.string().min(1),
  captionEn: z.string().min(1),
  captionAr: z.string().min(1),
  shape: z.enum(["is-tall", "is-wide", "is-square"]),
});

export type HomeGalleryItem = z.infer<typeof homeGallerySchema>;

/**
 * Everything on the storefront homepage the atelier can edit itself: the hero,
 * the "A look inside the pastry case" gallery and the closing call to action.
 */
export const homeSettingsSchema = z.object({
  heroImage: z.string().min(1),
  heroTitleAEn: z.string().min(1),
  heroTitleAAr: z.string().min(1),
  heroTitleEmEn: z.string().min(1),
  heroTitleEmAr: z.string().min(1),
  heroTitleBEn: z.string().min(1),
  heroTitleBAr: z.string().min(1),
  heroLeadEn: z.string().min(1),
  heroLeadAr: z.string().min(1),
  galleryTitleEn: z.string().min(1),
  galleryTitleAr: z.string().min(1),
  galleryLeadEn: z.string().min(1),
  galleryLeadAr: z.string().min(1),
  ctaTitleEn: z.string().min(1),
  ctaTitleAr: z.string().min(1),
  ctaLeadEn: z.string().min(1),
  ctaLeadAr: z.string().min(1),
  ctaButtonEn: z.string().min(1),
  ctaButtonAr: z.string().min(1),
  gallery: z.array(homeGallerySchema).length(6),
});

export type HomeSettings = z.infer<typeof homeSettingsSchema>;

export const defaultStoreSettings: StoreSettings = {
  phone: "+20 100 482 7719",
  whatsapp: "+201004827719",
  email: "hello@mazzaq.co",
  addressEn: "14 Street 9, Maadi, Cairo",
  addressAr: "١٤ شارع ٩، المعادي، القاهرة",
  instapayHandle: "mazzaq@instapay",
  instagram: "mazzaq.cairo",
};

export const defaultDeliverySettings: DeliverySettings = {
  deliveryFee: 7500,
  freeDeliveryThreshold: 200000,
  deliveryLeadTimeHours: 48,
  capacity: 8,
  timezone: "Africa/Cairo",
  deliveryAreas: [
    "Maadi",
    "Zamalek",
    "Heliopolis",
    "New Cairo",
    "Sheikh Zayed",
    "6th of October",
    "Downtown",
  ],
  deliveryWindows: [
    {
      key: "midday",
      labelEn: "11:00 – 14:00",
      labelAr: "١١:٠٠ – ١٤:٠٠",
      start: "11:00",
      end: "14:00",
    },
    {
      key: "afternoon",
      labelEn: "15:00 – 18:00",
      labelAr: "١٥:٠٠ – ١٨:٠٠",
      start: "15:00",
      end: "18:00",
    },
    {
      key: "evening",
      labelEn: "19:00 – 22:00",
      labelAr: "١٩:٠٠ – ٢٢:٠٠",
      start: "19:00",
      end: "22:00",
    },
  ],
};

export const defaultHomeSettings: HomeSettings = {
  heroImage: "/images/hero/hero.jpg",
  heroTitleAEn: "Baked for the",
  heroTitleAAr: "نخبز من أجل",
  heroTitleEmEn: "moments",
  heroTitleEmAr: "اللحظات",
  heroTitleBEn: "that matter.",
  heroTitleBAr: "التي تهم.",
  heroLeadEn:
    "Knafeh cheesecake, pistachio croissants and quiet little cakes — made by hand in Maadi, to order, for your table.",
  heroLeadAr:
    "تشيز كيك الكنافة، كرواسون الفستق وكعكات هادئة — تُصنع يدوياً في المعادي، حسب الطلب، لمائدتك.",
  galleryTitleEn: "A look inside the pastry case",
  galleryTitleAr: "نظرة داخل فاترينة الحلويات",
  galleryLeadEn: "Mornings at the atelier, in a few frames.",
  galleryLeadAr: "صباحات الأتيليه، في لقطات قليلة.",
  ctaTitleEn: "Something sweet, made for someone.",
  ctaTitleAr: "شيء حلو، صُنع لشخص ما.",
  ctaLeadEn: "Browse the pastry case and we’ll take it from there.",
  ctaLeadAr: "تصفّح فاترينة الحلويات وسنتولى الباقي.",
  ctaButtonEn: "Start an order",
  ctaButtonAr: "ابدأ طلباً",
  gallery: [
    {
      src: "/images/editorial/pastry-case.jpg",
      captionEn: "The pastry case",
      captionAr: "فاترينة الحلويات",
      shape: "is-tall",
    },
    {
      src: "/images/editorial/dessert-table.jpg",
      captionEn: "A table, set",
      captionAr: "مائدة مجهّزة",
      shape: "is-wide",
    },
    {
      src: "/images/editorial/baklava.jpg",
      captionEn: "Baklava, finished by hand",
      captionAr: "بقلاوة تُنتهي يدوياً",
      shape: "is-square",
    },
    {
      src: "/images/editorial/croissant-coffee.jpg",
      captionEn: "Morning coffee",
      captionAr: "قهوة الصباح",
      shape: "is-tall",
    },
    {
      src: "/images/editorial/coffee.jpg",
      captionEn: "The coffee bar",
      captionAr: "ركن القهوة",
      shape: "is-square",
    },
    {
      src: "/images/hero/hero.jpg",
      captionEn: "Knafeh cheesecake",
      captionAr: "تشيز كيك الكنافة",
      shape: "is-wide",
    },
  ],
};
