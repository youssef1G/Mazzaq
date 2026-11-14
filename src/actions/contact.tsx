"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { ContactEmail } from "@/lib/email/templates";
import { getStoreSettings } from "@/lib/settings";

export type ContactState = {
  status: "idle" | "success" | "error";
};

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().max(40).optional().default(""),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(5).max(4000),
});

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { status: "error" };
  }

  const settings = await getStoreSettings();
  const { name, email, phone, subject, message } = parsed.data;

  const result = await sendEmail({
    to: settings.email,
    subject: `Website message: ${subject}`,
    template: "contact",
    react: (
      <ContactEmail
        name={name}
        email={phone ? `${email} · ${phone}` : email}
        message={message}
      />
    ),
    text: `${name} <${email}>${phone ? ` (${phone})` : ""}\n\n${subject}\n\n${message}`,
  });

  return { status: result.status === "failed" ? "error" : "success" };
}
