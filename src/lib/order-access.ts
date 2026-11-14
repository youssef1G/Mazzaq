import "server-only";

import { cookies } from "next/headers";

const COOKIE = "mazzaq.orders";
const MAX_AGE = 60 * 60 * 24 * 180;

export async function grantOrderAccess(orderId: string) {
  const store = await cookies();
  const current = store.get(COOKIE)?.value;
  const ids = new Set(
    (current ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  ids.add(orderId);
  store.set(COOKIE, [...ids].slice(-25).join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function hasOrderAccess(orderId: string) {
  const store = await cookies();
  const ids = (store.get(COOKIE)?.value ?? "")
    .split(",")
    .map((value) => value.trim());
  return ids.includes(orderId);
}
