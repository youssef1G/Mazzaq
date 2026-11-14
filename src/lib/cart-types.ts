export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  variantNameEn: string;
  variantNameAr: string;
  unitPrice: number;
  imageUrl: string;
  quantity: number;
  maxQuantity: number;
  leadTimeHours: number;
};

export type CartInput = {
  variantId: string;
  quantity: number;
};

export type QuoteLine = {
  variantId: string;
  productId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  variantNameEn: string;
  variantNameAr: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  available: boolean;
  stock: number;
};

export type CartQuote = {
  lines: QuoteLine[];
  subtotal: number;
  discountTotal: number;
  discountCode: string | null;
  discountError: "invalid" | "minimum" | null;
  deliveryFee: number;
  deliveryFeeBase: number;
  freeDeliveryThreshold: number;
  total: number;
  issues: string[];
};

export const CART_STORAGE_KEY = "mazzaq.cart.v1";
