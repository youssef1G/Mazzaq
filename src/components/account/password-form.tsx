"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function PasswordForm() {
  const t = useTranslations("Account");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");

    if (newPassword.length < 8) {
      setMessage({ tone: "error", text: t("passwordLead") });
      return;
    }

    setPending(true);
    setMessage(null);
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);

    if (result.error) {
      setMessage({ tone: "error", text: t("passwordError") });
      return;
    }

    setMessage({ tone: "success", text: t("passwordUpdated") });
    event.currentTarget.reset();
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="currentPassword">{t("currentPassword")}</label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      <div className="field">
        <label htmlFor="newPassword">{t("newPassword")}</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
        <span className="form-note">{t("passwordLead")}</span>
      </div>
      {message ? (
        <p
          className={message.tone === "success" ? "form-success" : "form-error"}
        >
          {message.text}
        </p>
      ) : null}
      <button type="submit" className="button" disabled={pending}>
        {pending ? <Loader2 size={14} className="spin" /> : null}
        {pending ? t("updatingPassword") : t("updatePassword")}
      </button>
    </form>
  );
}
