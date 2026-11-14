"use client";

import { useTranslations } from "next-intl";

export type AddressValue = {
  id?: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  area: string;
  postalCode: string | null;
  isDefault: boolean;
};

export function AddressFields({
  address,
  prefix = "address",
}: {
  address?: AddressValue;
  prefix?: string;
}) {
  const t = useTranslations("Account");

  return (
    <div className="form-grid">
      {address?.id ? (
        <input type="hidden" name="id" value={address.id} />
      ) : null}
      <div className="field">
        <label htmlFor={`${prefix}-label`}>{t("addressLabel")}</label>
        <input
          id={`${prefix}-label`}
          name="label"
          className="input"
          required
          defaultValue={address?.label ?? ""}
          placeholder={t("addressLabelPlaceholder")}
        />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-recipient`}>{t("recipient")}</label>
        <input
          id={`${prefix}-recipient`}
          name="recipientName"
          className="input"
          required
          autoComplete="name"
          defaultValue={address?.recipientName ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-phone`}>{t("phone")}</label>
        <input
          id={`${prefix}-phone`}
          name="phone"
          className="input"
          required
          inputMode="tel"
          autoComplete="tel"
          defaultValue={address?.phone ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-area`}>{t("area")}</label>
        <input
          id={`${prefix}-area`}
          name="area"
          className="input"
          required
          autoComplete="address-level2"
          defaultValue={address?.area ?? ""}
        />
      </div>
      <div className="field span-2">
        <label htmlFor={`${prefix}-line1`}>{t("line1")}</label>
        <input
          id={`${prefix}-line1`}
          name="line1"
          className="input"
          required
          autoComplete="address-line1"
          defaultValue={address?.line1 ?? ""}
        />
      </div>
      <div className="field span-2">
        <label htmlFor={`${prefix}-line2`}>{t("line2")}</label>
        <input
          id={`${prefix}-line2`}
          name="line2"
          className="input"
          autoComplete="address-line2"
          defaultValue={address?.line2 ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-city`}>{t("city")}</label>
        <input
          id={`${prefix}-city`}
          name="city"
          className="input"
          required
          autoComplete="address-level1"
          defaultValue={address?.city ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-postal`}>{t("postal")}</label>
        <input
          id={`${prefix}-postal`}
          name="postalCode"
          className="input"
          inputMode="numeric"
          autoComplete="postal-code"
          defaultValue={address?.postalCode ?? ""}
        />
      </div>
      <label className="checkbox-row span-2">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? false}
        />
        <span>{t("defaultAddress")}</span>
      </label>
    </div>
  );
}
