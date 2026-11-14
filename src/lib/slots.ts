import "server-only";

import { TZDate } from "@date-fns/tz";
import { addHours, format } from "date-fns";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { blackoutDates, deliverySlots } from "@/db/schema";
import type { DeliverySettings } from "./settings-schema";

export type SlotOption = {
  id: string;
  date: string;
  windowKey: string;
  labelEn: string;
  labelAr: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  isBlocked: boolean;
};

export type SlotDay = {
  date: string;
  slots: SlotOption[];
};

export function earliestDateForLeadTime(hours: number): string {
  const target = new TZDate(
    Date.now() + hours * 60 * 60 * 1000,
    "Africa/Cairo",
  );
  return format(target, "yyyy-MM-dd");
}

export async function getSlotCalendar(settings: DeliverySettings): Promise<{
  delivery: SlotDay[];
  deliveryMinDate: string;
  blackouts: { date: string; reason: string }[];
}> {
  const db = await getDb();
  const today = format(new TZDate(Date.now(), "Africa/Cairo"), "yyyy-MM-dd");
  const lastDay = format(
    addHours(new TZDate(Date.now(), "Africa/Cairo"), 24 * 60),
    "yyyy-MM-dd",
  );

  const rows = await db
    .select()
    .from(deliverySlots)
    .where(
      and(
        gte(deliverySlots.date, today),
        lte(deliverySlots.date, lastDay),
        eq(deliverySlots.kind, "delivery"),
      ),
    )
    .orderBy(asc(deliverySlots.date), asc(deliverySlots.startTime));

  const blocked = await db.select().from(blackoutDates);
  const blockedDates = new Set(blocked.map((row) => row.date));

  const available = rows
    .filter(
      (row) =>
        !row.isBlocked &&
        !blockedDates.has(row.date) &&
        row.booked < row.capacity,
    )
    .map<SlotOption>((row) => ({
      id: row.id,
      date: row.date,
      windowKey: row.windowKey,
      labelEn: row.labelEn,
      labelAr: row.labelAr,
      startTime: row.startTime,
      endTime: row.endTime,
      capacity: row.capacity,
      booked: row.booked,
      isBlocked: row.isBlocked,
    }));

  const days = new Map<string, SlotOption[]>();
  for (const slot of available) {
    const list = days.get(slot.date) ?? [];
    list.push(slot);
    days.set(slot.date, list);
  }

  return {
    delivery: [...days.entries()].map(([date, slots]) => ({ date, slots })),
    deliveryMinDate: earliestDateForLeadTime(settings.deliveryLeadTimeHours),
    blackouts: blocked.map((row) => ({ date: row.date, reason: row.reason })),
  };
}

export async function getSlotById(id: string) {
  const db = await getDb();
  const row = await db.query.deliverySlots.findFirst({
    where: eq(deliverySlots.id, id),
  });
  return row ?? null;
}
