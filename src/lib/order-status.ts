import type { OrderStatus, PaymentStatus } from "@/db/schema";

export const orderStatuses: OrderStatus[] = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled",
];

export const paymentStatuses: PaymentStatus[] = ["unpaid", "paid", "refunded"];

/**
 * Older orders may still hold retired status values. Fold them into the
 * current five-step flow so every row renders and filters consistently.
 */
export function normalizeOrderStatus(status: string): OrderStatus {
  switch (status) {
    case "preparing":
    case "out_for_delivery":
    case "completed":
    case "cancelled":
      return status;
    case "ready":
      return "out_for_delivery";
    default:
      return "confirmed";
  }
}

export function normalizePaymentStatus(status: string): PaymentStatus {
  switch (status) {
    case "paid":
    case "refunded":
      return status;
    default:
      return "unpaid";
  }
}

export function orderStatusKey(status: string) {
  switch (normalizeOrderStatus(status)) {
    case "confirmed":
      return "statusConfirmed";
    case "preparing":
      return "statusPreparing";
    case "out_for_delivery":
      return "statusOutForDelivery";
    case "completed":
      return "statusCompleted";
    case "cancelled":
      return "statusCancelled";
  }
}

export function paymentStatusKey(status: string) {
  switch (normalizePaymentStatus(status)) {
    case "unpaid":
      return "paymentUnpaid";
    case "paid":
      return "paymentPaid";
    case "refunded":
      return "paymentRefunded";
  }
}

export function orderStatusTone(status: string) {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "cancelled") return "red";
  if (normalized === "completed") return "green";
  if (normalized === "preparing") return "amber";
  if (normalized === "out_for_delivery") return "blue";
  return "muted";
}

export function paymentStatusTone(status: string) {
  const normalized = normalizePaymentStatus(status);
  if (normalized === "paid") return "green";
  if (normalized === "refunded") return "muted";
  return "amber";
}
