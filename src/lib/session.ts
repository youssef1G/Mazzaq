import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from "./auth";

export const getSession = cache(async () => {
  const auth = await getAuth();
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function requireUser(locale: string, redirectTo?: string) {
  const session = await getSession();
  if (!session?.user) {
    redirect(redirectTo ?? `/${locale}/sign-in`);
  }
  return session;
}

export async function requireAdmin(locale: string) {
  const session = await requireUser(locale, `/${locale}/admin/sign-in`);
  if (session.user.role !== "admin") {
    redirect(`/${locale}/admin/sign-in`);
  }
  return session;
}
