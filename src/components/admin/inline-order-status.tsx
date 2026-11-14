"use client";

import { useTranslations } from "next-intl";
import { updateOrderStatus } from "@/actions/admin";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import {
  orderStatuses,
  orderStatusKey,
  orderStatusTone,
} from "@/lib/order-status";

export function InlineOrderStatus({
  orderId,
  locale,
  status,
  returnTo,
}: {
  orderId: string;
  locale: string;
  status: string;
  returnTo: string;
}) {
  const orderT = useTranslations("Order");
  const t = useTranslations("Admin");

  return (
    <form action={updateOrderStatus} className="inline-status-form">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <DropdownSelect
        name="status"
        compact
        submitOnChange
        tone={orderStatusTone(status)}
        defaultValue={status}
        label={t("status")}
        options={orderStatuses.map((value) => ({
          value,
          label: orderT(orderStatusKey(value)),
        }))}
      />
    </form>
  );
}
