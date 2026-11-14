import "server-only";

import { render } from "@react-email/render";
import { eq } from "drizzle-orm";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { getDb } from "@/db";
import { emailOutbox } from "@/db/schema";

type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
  text: string;
  template: string;
};

type SendEmailResult =
  | { status: "logged" | "sent"; id: string; error?: undefined }
  | { status: "failed"; id: string; error: string };

export async function sendEmail({
  to,
  subject,
  react,
  text,
  template,
}: SendEmailInput): Promise<SendEmailResult> {
  const html = await render(react);
  const db = await getDb();

  const [row] = await db
    .insert(emailOutbox)
    .values({
      to,
      subject,
      html,
      text,
      template,
      status: "logged",
    })
    .returning({ id: emailOutbox.id });

  const id = row?.id ?? crypto.randomUUID();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { status: "logged", id };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Mazzaق <orders@mazzaq.co>",
      to,
      subject,
      html,
      text,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    await db
      .update(emailOutbox)
      .set({
        status: "sent",
        providerId: result.data?.id ?? null,
      })
      .where(eq(emailOutbox.id, id));

    return { status: "sent", id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Email delivery failed", { template, to, message });
    await db
      .update(emailOutbox)
      .set({ status: "failed", error: message })
      .where(eq(emailOutbox.id, id));
    return { status: "failed", id, error: message };
  }
}
