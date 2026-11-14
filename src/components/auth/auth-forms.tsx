"use client";

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

function passwordLooksValid(value: string) {
  return value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value);
}

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setPending(false);
    if (result.error) {
      setError(t("invalid"));
      return;
    }
    router.push(redirectTo || "/account");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="email">{t("email")}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </div>
      <div className="field">
        <label htmlFor="password">{t("password")}</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="button button-block" disabled={pending}>
        {pending ? <Loader2 size={14} /> : null}
        {pending ? t("signingIn") : t("signIn")}
      </button>
      <div className="auth-links">
        <Link href="/forgot-password">{t("forgot")}</Link>
      </div>
    </form>
  );
}

export function AdminSignInForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (result.error) {
      setPending(false);
      setError(t("invalid"));
      return;
    }

    const role = (
      result.data as { user?: { role?: string } } | null | undefined
    )?.user?.role;
    if (role !== "admin") {
      await authClient.signOut();
      setPending(false);
      setError(t("adminOnly"));
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="admin-email">{t("email")}</label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </div>
      <div className="field">
        <label htmlFor="admin-password">{t("password")}</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="button button-block" disabled={pending}>
        {pending ? <Loader2 size={14} /> : null}
        {pending ? t("signingIn") : t("signIn")}
      </button>
    </form>
  );
}

export function SignUpForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (!passwordLooksValid(password)) {
      setError(t("passwordHint"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    setPending(true);
    setError(null);
    const result = await authClient.signUp.email({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password,
    });
    setPending(false);
    if (result.error) {
      setError(t("error"));
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="name">{t("name")}</label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className="input"
        />
      </div>
      <div className="field">
        <label htmlFor="email">{t("email")}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </div>
      <div className="field">
        <label htmlFor="password">{t("password")}</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="input"
        />
        <span className="form-note">{t("passwordHint")}</span>
      </div>
      <div className="field">
        <label htmlFor="confirm">{t("password")}</label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="input"
        />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="button button-block" disabled={pending}>
        {pending ? <Loader2 size={14} /> : null}
        {pending ? t("signingUp") : t("signUp")}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await authClient.requestPasswordReset({
      email: String(form.get("email") ?? ""),
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    });
    setPending(false);
    if (result.error) {
      setError(t("error"));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="auth-form">
        <p className="form-success">{t("sentReset")}</p>
        <Link href="/sign-in" className="button button-block">
          {t("backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="email">{t("email")}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="button button-block" disabled={pending}>
        {pending ? <Loader2 size={14} /> : null}
        {pending ? t("sendingReset") : t("sendReset")}
      </button>
      <div className="auth-links">
        <Link href="/sign-in">{t("backToSignIn")}</Link>
      </div>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (!passwordLooksValid(password)) {
      setError(t("passwordHint"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    setPending(true);
    setError(null);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setPending(false);
    if (result.error) {
      setError(t("error"));
      return;
    }
    setDone(true);
    window.setTimeout(() => {
      router.push("/sign-in");
      router.refresh();
    }, 1400);
  }

  if (done) {
    return (
      <div className="auth-form">
        <p className="form-success">{t("resetSuccess")}</p>
        <Link href="/sign-in" className="button button-block">
          {t("backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="password">{t("newPassword")}</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="input"
        />
        <span className="form-note">{t("resetLead")}</span>
      </div>
      <div className="field">
        <label htmlFor="confirm">{t("newPassword")}</label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="input"
        />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="button button-block" disabled={pending}>
        {pending ? <Loader2 size={14} /> : null}
        {pending ? t("resetting") : t("resetPassword")}
      </button>
    </form>
  );
}
