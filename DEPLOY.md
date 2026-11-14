# Deploying Mazzaق to Vercel

The repo is ready to push. This checklist covers the pieces that don't live in
the codebase: the Neon database, the Vercel Blob token, environment variables,
and the one-time migration + seed.

Local development keeps working as before (PGlite, no services needed).

---

## 1. Push to GitHub

```bash
git remote add origin git@github.com:<you>/mazzaq.git
git push -u origin main
```

or with HTTPS: `git remote add origin https://github.com/<you>/mazzaq.git`

## 2. Create the Neon database (Vercel)

1. Vercel dashboard → **Storage** → **Marketplace** → **Neon** → free plan.
2. Copy the **pooled connection string** (usually `postgres://…-pooler.neon.tech/…?sslmode=require`).
3. Note the direct (non-pooled) URL too — used for migrations.

## 3. Create the Vercel Blob store

1. Vercel dashboard → **Storage** → **Blob** → create store.
2. Copy the `BLOB_READ_WRITE_TOKEN`.

## 4. Vercel project settings

Import the GitHub repo (**Add New → Project**), then set these environment
variables (all environments, or at least Production):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (no trailing slash) |
| `BETTER_AUTH_URL` | `https://<your-domain>` |
| `BETTER_AUTH_SECRET` | 32+ random bytes (`openssl rand -base64 32`) |
| `REQUIRE_EMAIL_VERIFICATION` | `false` |
| `RESEND_API_KEY` | *(empty — emails stay in /admin/outbox)* |
| `EMAIL_FROM` | `Mazzaق <orders@mazzaq.co>` |
| `ADMIN_EMAIL` | the real admin address |
| `ADMIN_PASSWORD` | a strong, new password |
| `ADMIN_NAME` | `Mazzaق Admin` |
| `AUTO_MIGRATE` | `true` *(first deploy only — creates the schema)* |
| `AUTO_SEED` | `true` *(first deploy only — loads catalog + admin user)* |
| `BLOB_READ_WRITE_TOKEN` | from step 3 |
| `PGLITE_DATA_DIR` | *(leave unset in production)* |

After the first successful deploy, set `AUTO_MIGRATE=false` and `AUTO_SEED=false`
so future boots don't re-run migrations/seeding.

## 5. Migrate + seed from your machine (or let the app do it)

Point your local env at Neon and run the two CLIs:

```bash
set DATABASE_URL=<neon direct or pooled URL>
set AUTO_MIGRATE=false
set AUTO_SEED=false
pnpm tsx src/db/migrate-cli.ts
set AUTO_SEED=true
pnpm tsx src/db/seed-cli.ts
```

PowerShell version: use `$env:DATABASE_URL=...` syntax instead of `set`.

## 6. Deploy

Push to `main` — Vercel builds and deploys automatically. The build runs
`next build`; all routes render dynamically at request time.

## 7. After the first deploy

- Open `/en/admin/sign-in`, sign in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- Change the admin password immediately from Account.
- Upload at least one homepage image + set your store phone/WhatsApp/Instagram/
  address in Settings — the seed values are placeholders.
- Confirm order emails are landing in `/en/admin/outbox` (they only land there
  until you connect Resend + verify the `mazzaq.co` domain in Resend).

## Notes

- Receipt uploads are stored in the database (base64), no storage needed.
- Admin image uploads go to Vercel Blob (persistent, survives redeploys).
- `/public/uploads` is gitignored and only written in local dev.
- The local PGlite DB (`.data/pglite`) is gitignored and never sent to Vercel.
