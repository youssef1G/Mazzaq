import { setRequestLocale } from "next-intl/server";
import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/lib/session";

export default async function AccountLayout({
  children,
  params,
}: LayoutProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireUser(locale);

  return (
    <div className="shell account-page">
      <div className="account-layout">
        <AccountNav isAdmin={session.user.role === "admin"} />
        <div>{children}</div>
      </div>
    </div>
  );
}
