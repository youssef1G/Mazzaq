"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { type ContactState, sendContactMessage } from "@/actions/contact";

const initialState: ContactState = { status: "idle" };

export function ContactForm() {
  const t = useTranslations("Contact");
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    initialState,
  );

  return (
    <form action={formAction} className="contact-form">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="contact-name">{t("name")}</label>
          <input
            id="contact-name"
            name="name"
            className="input"
            required
            autoComplete="name"
          />
        </div>
        <div className="field">
          <label htmlFor="contact-email">{t("email")}</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            className="input"
            required
            autoComplete="email"
          />
        </div>
        <div className="field span-2">
          <label htmlFor="contact-phone">{t("phone")}</label>
          <input
            id="contact-phone"
            name="phone"
            className="input"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <div className="field span-2">
          <label htmlFor="contact-subject">{t("subject")}</label>
          <input
            id="contact-subject"
            name="subject"
            className="input"
            required
          />
        </div>
        <div className="field span-2">
          <label htmlFor="contact-message">{t("message")}</label>
          <textarea
            id="contact-message"
            name="message"
            className="textarea"
            required
            minLength={5}
            placeholder={t("messagePlaceholder")}
          />
        </div>
      </div>

      {state.status === "success" ? (
        <p className="form-success">{t("sent")}</p>
      ) : null}
      {state.status === "error" ? (
        <p className="form-error">{t("error")}</p>
      ) : null}

      <button type="submit" className="button" disabled={pending}>
        {pending ? <Loader2 size={14} className="spin" /> : null}
        {pending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
