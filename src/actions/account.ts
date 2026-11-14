"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { addresses, user } from "@/db/schema";
import { requireUser } from "@/lib/session";

function readBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

const addressSchema = z.object({
  label: z.string().trim().min(1).max(60),
  recipientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).default(""),
  city: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().max(20).default(""),
  isDefault: z.boolean(),
});

export async function saveAddress(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const session = await requireUser(locale);
  const id = String(formData.get("id") ?? "").trim();

  const parsed = addressSchema.safeParse({
    label: formData.get("label"),
    recipientName: formData.get("recipientName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    city: formData.get("city"),
    area: formData.get("area"),
    postalCode: formData.get("postalCode") ?? "",
    isDefault: readBoolean(formData.get("isDefault")),
  });

  if (!parsed.success) {
    redirect(`/${locale}/account/addresses?error=required`);
  }

  const db = await getDb();
  const data = parsed.data;

  await db.transaction(async (tx) => {
    const existing = await tx.query.addresses.findMany({
      where: eq(addresses.userId, session.user.id),
      columns: { id: true, isDefault: true },
    });

    if (data.isDefault) {
      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, session.user.id));
    }

    const shouldBeDefault = data.isDefault || existing.length === 0;

    if (id) {
      await tx
        .update(addresses)
        .set({
          label: data.label,
          recipientName: data.recipientName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 || null,
          city: data.city,
          area: data.area,
          postalCode: data.postalCode || null,
          isDefault: shouldBeDefault,
        })
        .where(
          and(eq(addresses.id, id), eq(addresses.userId, session.user.id)),
        );
    } else {
      await tx.insert(addresses).values({
        userId: session.user.id,
        label: data.label,
        recipientName: data.recipientName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        area: data.area,
        postalCode: data.postalCode || null,
        isDefault: shouldBeDefault,
      });
    }

    if (!shouldBeDefault) {
      const remaining = await tx.query.addresses.findFirst({
        where: and(
          eq(addresses.userId, session.user.id),
          eq(addresses.isDefault, true),
          id ? ne(addresses.id, id) : undefined,
        ),
        columns: { id: true },
      });
      if (!remaining) {
        const fallback = await tx.query.addresses.findFirst({
          where: eq(addresses.userId, session.user.id),
          columns: { id: true },
        });
        if (fallback) {
          await tx
            .update(addresses)
            .set({ isDefault: true })
            .where(eq(addresses.id, fallback.id));
        }
      }
    }
  });

  revalidatePath(`/${locale}/account/addresses`);
  redirect(`/${locale}/account/addresses?saved=1`);
}

export async function deleteAddress(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const session = await requireUser(locale);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/${locale}/account/addresses`);

  const db = await getDb();
  await db.transaction(async (tx) => {
    const target = await tx.query.addresses.findFirst({
      where: and(eq(addresses.id, id), eq(addresses.userId, session.user.id)),
      columns: { id: true, isDefault: true },
    });
    if (!target) return;

    await tx
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, session.user.id)));

    if (target.isDefault) {
      const fallback = await tx.query.addresses.findFirst({
        where: eq(addresses.userId, session.user.id),
        columns: { id: true },
      });
      if (fallback) {
        await tx
          .update(addresses)
          .set({ isDefault: true })
          .where(eq(addresses.id, fallback.id));
      }
    }
  });

  revalidatePath(`/${locale}/account/addresses`);
  redirect(`/${locale}/account/addresses`);
}

export async function setDefaultAddress(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const session = await requireUser(locale);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/${locale}/account/addresses`);

  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, session.user.id));
    await tx
      .update(addresses)
      .set({ isDefault: true })
      .where(and(eq(addresses.id, id), eq(addresses.userId, session.user.id)));
  });

  revalidatePath(`/${locale}/account/addresses`);
  redirect(`/${locale}/account/addresses`);
}

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).default(""),
});

export async function updateProfile(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const session = await requireUser(locale);

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
  });

  if (!parsed.success) {
    redirect(`/${locale}/account/profile?error=required`);
  }

  const db = await getDb();
  await db
    .update(user)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    })
    .where(eq(user.id, session.user.id));

  revalidatePath(`/${locale}/account`, "layout");
  redirect(`/${locale}/account/profile?saved=1`);
}
