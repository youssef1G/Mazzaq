"use client";

import { Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { type ReceiptState, uploadReceipt } from "@/actions/checkout";

const initial: ReceiptState = { status: "idle", error: null };

export function ReceiptUpload({ orderId }: { orderId: string }) {
  const t = useTranslations("Order");
  const common = useTranslations("Common");
  const [state, formAction, pending] = useActionState(uploadReceipt, initial);

  return (
    <form action={formAction} className="receipt-input">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="field-label" htmlFor={`receipt-${orderId}`}>
        {t("uploadReceipt")}
      </label>
      <input
        id={`receipt-${orderId}`}
        type="file"
        name="receipt"
        required
        accept="image/jpeg,image/png,image/webp,application/pdf"
      />
      <button
        type="submit"
        className="button button-small"
        style={{ marginBlockStart: "0.6rem" }}
        disabled={pending}
      >
        {pending ? (
          <Loader2 size={13} />
        ) : (
          <Upload size={13} strokeWidth={1.6} />
        )}
        {pending ? common("saving") : t("uploadReceipt")}
      </button>
      {state.status === "success" ? (
        <p className="form-success" style={{ marginBlockStart: "0.6rem" }}>
          {t("receiptUploaded")}
        </p>
      ) : null}
      {state.error ? (
        <p className="field-error" style={{ marginBlockStart: "0.6rem" }}>
          {state.error === "file"
            ? t("receiptTooLarge")
            : state.error === "closed"
              ? t("receiptClosed")
              : t("notFound")}
        </p>
      ) : null}
    </form>
  );
}
