import "server-only";

import { eq } from "drizzle-orm";
import type { ZodType } from "zod";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import {
  type DeliverySettings,
  defaultDeliverySettings,
  defaultHomeSettings,
  defaultStoreSettings,
  deliverySettingsSchema,
  type HomeSettings,
  homeSettingsSchema,
  type StoreSettings,
  storeSettingsSchema,
} from "./settings-schema";

async function readSetting<T>(
  key: string,
  schema: ZodType<T>,
  fallback: T,
): Promise<T> {
  const db = await getDb();
  const row = await db.query.settings.findFirst({
    where: eq(settings.key, key),
  });
  if (!row) return fallback;
  const parsed = schema.safeParse(row.value);
  return parsed.success ? parsed.data : fallback;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  return readSetting("store", storeSettingsSchema, defaultStoreSettings);
}

export async function getDeliverySettings(): Promise<DeliverySettings> {
  return readSetting(
    "delivery",
    deliverySettingsSchema,
    defaultDeliverySettings,
  );
}

export async function getHomeSettings(): Promise<HomeSettings> {
  return readSetting("home", homeSettingsSchema, defaultHomeSettings);
}
