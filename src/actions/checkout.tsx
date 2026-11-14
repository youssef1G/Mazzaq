"use server";

import { format } from "date-fns";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import {
  discountRedemptions,
  discounts,
  orderEvents,
  orderItems,
  orderReceipts,
  orders,
  productVariants,
} from "@/db/schema";
import type { CartInput } from "@/lib/cart-types";
import type { CheckoutState } from "@/lib/checkout-state";
import { sendEmail } from "@/lib/email/send";
import { OrderConfirmationEmail } from "@/lib/email/templates";
import { formatMoney } from "@/lib/money";
import { grantOrderAccess, hasOrderAccess } from "@/lib/order-access";
import {
  normalizeOrderStatus,
  normalizePaymentStatus,
} from "@/lib/order-status";
import { quoteCart, resolveDiscount } from "@/lib/pricing";
import { getSession } from "@/lib/session";
import { getStoreSettings } from "@/lib/settings";

const MAX_RECEIPT = 4 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const checkoutSchema = z.object({
  locale: z.enum(["en", "ar"]).default("en"),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().min(6).max(40),
  line1: z.string().trim().max(200).default(""),
  line2: z.string().trim().max(200).default(""),
  city: z.string().trim().max(80).default(""),
  area: z.string().trim().max(80).default(""),
  notes: z.string().trim().max(1000).default(""),
  payment: z.enum(["cod", "instapay"]),
  discountCode: z.string().trim().max(40).default(""),
});

function orderNumber() {
  const stamp = format(new Date(), "yyMMdd");
  const suffix = crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 5)
    .toUpperCase();
  return `MZQ-${stamp}-${suffix}`;
}

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    locale: formData.get("locale") ?? "en",
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    line1: formData.get("line1") ?? "",
    line2: formData.get("line2") ?? "",
    city: formData.get("city") ?? "",
    area: formData.get("area") ?? "",
    notes: formData.get("notes") ?? "",
    payment: formData.get("payment") ?? "cod",
    discountCode: formData.get("discountCode") ?? "",
  });

  if (!parsed.success) {
    return { status: "error", error: "required" };
  }

  let items: CartInput[] = [];
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]")) as unknown;
    if (Array.isArray(raw)) {
      items = raw
        .filter(
          (item): item is CartInput =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as CartInput).variantId === "string" &&
            typeof (item as CartInput).quantity === "number",
        )
        .slice(0, 40);
    }
  } catch {
    items = [];
  }

  if (items.length === 0) {
    return { status: "error", error: "cart" };
  }

  const data = parsed.data;

  if (!data.line1 || !data.city || !data.area) {
    return { status: "error", error: "required" };
  }

  const [settings, quote, session] = await Promise.all([
    getStoreSettings(),
    quoteCart(items, {
      discountCode: data.discountCode || null,
    }),
    getSession(),
  ]);

  if (quote.lines.length === 0) {
    return { status: "error", error: "cart" };
  }
  if (quote.issues.length > 0) {
    return { status: "error", error: "stock" };
  }
  if (data.discountCode && !quote.discountCode) {
    return { status: "error", error: "discount" };
  }

  const db = await getDb();
  const number = orderNumber();
  let createdId: string | null = null;

  // Resolve the discount before opening the transaction. PGlite runs on a
  // single connection, so querying the database from inside an open
  // transaction would deadlock against itself.
  const redeemedDiscount = quote.discountCode
    ? await resolveDiscount(quote.discountCode, quote.subtotal)
    : null;

  try {
    await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: number,
          userId: session?.user?.id ?? null,
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone,
          locale: data.locale,
          fulfillmentType: "delivery",
          deliverySlotId: null,
          deliveryDate: null,
          deliveryWindow: null,
          addressLine1: data.line1,
          addressLine2: data.line2,
          city: data.city,
          area: data.area,
          notes: data.notes || null,
          status: "confirmed",
          paymentStatus: "unpaid",
          paymentMethod: data.payment,
          subtotal: quote.subtotal,
          discountTotal: quote.discountTotal,
          deliveryFee: quote.deliveryFee,
          total: quote.total,
          discountCode: quote.discountCode,
          confirmedAt: new Date(),
        })
        .returning({ id: orders.id });

      if (!order) throw new Error("ORDER_FAILED");
      createdId = order.id;

      await tx.insert(orderItems).values(
        quote.lines.map((line) => ({
          orderId: order.id,
          productId: line.productId,
          variantId: line.variantId,
          productNameEn: line.nameEn,
          productNameAr: line.nameAr,
          variantNameEn: line.variantNameEn,
          variantNameAr: line.variantNameAr,
          sku: line.variantId,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
        })),
      );

      for (const line of quote.lines) {
        await tx
          .update(productVariants)
          .set({
            stock: sql`greatest(${productVariants.stock} - ${line.quantity}, 0)`,
          })
          .where(
            and(
              eq(productVariants.id, line.variantId),
              eq(productVariants.trackInventory, true),
            ),
          );
      }

      if (redeemedDiscount?.ok) {
        await tx
          .update(discounts)
          .set({ usedCount: sql`${discounts.usedCount} + 1` })
          .where(eq(discounts.id, redeemedDiscount.discount.id));
        await tx.insert(discountRedemptions).values({
          discountId: redeemedDiscount.discount.id,
          orderId: order.id,
          customerEmail: data.email,
          amount: quote.discountTotal,
        });
      }

      await tx.insert(orderEvents).values({
        orderId: order.id,
        type: "placed",
        message:
          data.payment === "cod"
            ? "Order placed. Cash on delivery."
            : "Order placed. InstaPay transfer to follow.",
      });
    });
  } catch (error) {
    console.error("Failed to place order", error);
    return { status: "error", error: "server" };
  }

  if (!createdId) {
    return { status: "error", error: "server" };
  }

  await grantOrderAccess(createdId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const orderUrl = `${siteUrl}/${data.locale}/order/${number}`;
  const itemLines = quote.lines.map((line) => ({
    name: data.locale === "ar" ? line.nameAr : line.nameEn,
    variant: data.locale === "ar" ? line.variantNameAr : line.variantNameEn,
    quantity: line.quantity,
    lineTotal: formatMoney(line.lineTotal, data.locale),
  }));
  const when =
    data.locale === "ar"
      ? "سيؤكد فريقنا موعد التوصيل."
      : "Our team will confirm the delivery date.";
  const address = [data.line1, data.line2, data.area, data.city]
    .filter(Boolean)
    .join(", ");

  void sendEmail({
    to: data.email,
    subject:
      data.locale === "ar"
        ? `تم استلام طلبك ${number}`
        : `Order ${number} received`,
    template: "order-confirmation",
    react: (
      <OrderConfirmationEmail
        name={data.name}
        orderNumber={number}
        total={formatMoney(quote.total, data.locale)}
        paymentMethod={data.payment}
        items={itemLines}
        fulfillment={data.locale === "ar" ? "التوصيل" : "Delivery"}
        when={when}
        address={address}
        instapayHandle={
          data.payment === "instapay" ? settings.instapayHandle : undefined
        }
        orderUrl={orderUrl}
        locale={data.locale}
      />
    ),
    text:
      data.locale === "ar"
        ? `استلمنا طلبك ${number}. الإجمالي ${formatMoney(
            quote.total,
            data.locale,
          )}. ${when}. ${orderUrl}`
        : `Order ${number} received. Total ${formatMoney(
            quote.total,
            data.locale,
          )}. ${when}. ${orderUrl}`,
  });

  revalidatePath(`/${data.locale}/shop`, "layout");
  redirect(`/${data.locale}/order/${number}`);
}

export type DiscountCheck = {
  ok: boolean;
  code: string | null;
  amount: number;
  reason: "invalid" | "minimum" | null;
};

export async function checkDiscount(
  code: string,
  subtotal: number,
): Promise<DiscountCheck> {
  if (!code.trim()) {
    return { ok: false, code: null, amount: 0, reason: "invalid" };
  }
  const result = await resolveDiscount(code, Math.max(0, subtotal));
  if (!result.ok) {
    return { ok: false, code: null, amount: 0, reason: result.reason };
  }
  return {
    ok: true,
    code: result.discount.code,
    amount: result.amount,
    reason: null,
  };
}

export type ReceiptState = {
  status: "idle" | "success" | "error";
  error: string | null;
};

export async function uploadReceipt(
  _prev: ReceiptState,
  formData: FormData,
): Promise<ReceiptState> {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId || !(await hasOrderAccess(orderId))) {
    return { status: "error", error: "unauthorized" };
  }

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", error: "file" };
  }
  if (file.size > MAX_RECEIPT || !ALLOWED_TYPES.includes(file.type)) {
    return { status: "error", error: "file" };
  }

  const db = await getDb();
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order || order.paymentMethod !== "instapay") {
    return { status: "error", error: "server" };
  }

  const status = normalizeOrderStatus(order.status);
  if (
    status === "completed" ||
    status === "cancelled" ||
    normalizePaymentStatus(order.paymentStatus) !== "unpaid"
  ) {
    return { status: "error", error: "closed" };
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  await db.transaction(async (tx) => {
    await tx
      .insert(orderReceipts)
      .values({
        orderId,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        dataBase64: base64,
      })
      .onConflictDoUpdate({
        target: orderReceipts.orderId,
        set: {
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          dataBase64: base64,
        },
      });
    await tx.insert(orderEvents).values({
      orderId,
      type: "receipt-uploaded",
      message: "InstaPay receipt uploaded.",
    });
  });

  revalidatePath(`/en/order/${order.orderNumber}`);
  revalidatePath(`/ar/order/${order.orderNumber}`);
  revalidatePath(`/en/admin/orders/${orderId}`);
  revalidatePath(`/ar/admin/orders/${orderId}`);
  return { status: "success", error: null };
}
