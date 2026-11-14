import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail } from "./email/send";
import {
  PasswordChangedEmail,
  ResetPasswordEmail,
  VerificationEmail,
  WelcomeEmail,
} from "./email/templates";

function siteUrl() {
  return (
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

async function buildAuth() {
  const db = await getDb();

  return betterAuth({
    baseURL: siteUrl(),
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification:
        process.env.REQUIRE_EMAIL_VERIFICATION === "true",
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        void sendEmail({
          to: user.email,
          subject: "Reset your Mazzaق password",
          template: "reset-password",
          react: <ResetPasswordEmail name={user.name} url={url} />,
          text: `Hello ${user.name}, reset your Mazzaق password here: ${url}`,
        });
      },
      onPasswordReset: async ({ user }) => {
        void sendEmail({
          to: user.email,
          subject: "Your Mazzaق password was changed",
          template: "password-changed",
          react: <PasswordChangedEmail name={user.name} />,
          text: `Hello ${user.name}, your Mazzaق password was changed. If this was not you, contact us immediately.`,
        });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        void sendEmail({
          to: user.email,
          subject: "Confirm your Mazzaق account",
          template: "verify-email",
          react: <VerificationEmail name={user.name} url={url} />,
          text: `Hello ${user.name}, confirm your Mazzaق account here: ${url}`,
        });
      },
    },
    user: {
      additionalFields: {
        phone: {
          type: "string",
          required: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (createdUser) => {
            void sendEmail({
              to: createdUser.email,
              subject: "Welcome to Mazzaق",
              template: "welcome",
              react: <WelcomeEmail name={createdUser.name} />,
              text: `Hello ${createdUser.name}, welcome to Mazzaق. Your account is ready.`,
            });
          },
        },
      },
    },
    plugins: [admin(), nextCookies()],
  });
}

type Auth = Awaited<ReturnType<typeof buildAuth>>;

let authPromise: Promise<Auth> | null = null;

export function getAuth(): Promise<Auth> {
  if (!authPromise) {
    authPromise = buildAuth().catch((error) => {
      authPromise = null;
      throw error;
    });
  }
  return authPromise;
}
