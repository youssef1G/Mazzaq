# Deploying Mazzaق to Vercel (Neon + Vercel Blob)

The repo is ready to push. This checklist covers the pieces that don't live in
the codebase: the Neon database, the Vercel Blob token, environment variables,
and the one-time migration + seed.

Everything here fits on free plans: Vercel Hobby, Neon Free, Vercel Blob.
Local development keeps working as before (PGlite, no services needed).

---

## 1. Push to GitHub

The repo lives at `https://github.com/youssef1G/Mazzaq` on branch `master`.

```bash
git remote add origin https://github.com/youssef1G/Mazzaq.git
git push -u origin master
```

## 2. Import the project on Vercel

Vercel → **Add New → Project** → import `youssef1G/Mazzaq`. Framework is
detected as Next.js; keep the defaults (pnpm + `next build`). Create the project
now (you can add storage and env vars before the first production deploy).

## 3. Create the Neon database (free)

1. Vercel → **Storage** → **Marketplace** → **Neon** → free plan.
2. Connect it to the Mazzak project and pick the region closest to your users.
3. Vercel automatically adds the env vars. Use the ones Neon creates:
   - `DATABASE_URL` — **pooled** connection, used by the app at runtime.
   - `DATABASE_URL_UNPOOLED` — **direct** connection, used for seeding.

No manual copy/paste and no database password to manage.

## 4. Create the Vercel Blob store

1. Vercel → **Storage** → **Blob** → **Create store**.
2. Connect it to the project. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.

## 5. Vercel environment variables

Add these under **Project → Settings → Environment Variables** (Production; tick
Preview/Development too if you want previews to work). Leave the Neon/Blob
variables alone — they are added automatically.

| Name | Value |
| --- | --- |
| `DATABASE_URL` | *(auto from Neon — pooled)* |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (no trailing slash) |
| `BETTER_AUTH_URL` | `https://<your-domain>` |
| `BETTER_AUTH_SECRET` | 32+ random bytes (generate below) |
| `REQUIRE_EMAIL_VERIFICATION` | `false` |
| `RESEND_API_KEY` | *(empty — emails stay in `/admin/outbox`)* |
| `EMAIL_FROM` | `Mazzaق <orders@mazzaq.co>` |
| `ADMIN_EMAIL` | the real admin address |
| `ADMIN_PASSWORD` | a strong, new password |
| `ADMIN_NAME` | `Mazzaق Admin` |
| `AUTO_MIGRATE` | `true` *(first deploy only)* |
| `AUTO_SEED` | `false` *(seeding runs manually; see step 7)* |
| `BLOB_READ_WRITE_TOKEN` | *(auto from Blob store)* |
| `PGLITE_DATA_DIR` | *(leave unset in production)* |

Generate the secret (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 6. Deploy

Click **Deploy**. Vercel runs `next build`; all routes render dynamically at
request time. With `AUTO_MIGRATE=true`, the first request creates the schema.

## 7. Seed the catalog + admin (required)

With `DATABASE_URL` set, the app auto-**migrates** but does **not** auto-seed
(seeding only exists in the local PGlite path). Run it once from your machine
against the **unpooled** Neon URL:

```powershell
$env:DATABASE_URL="<Neon DATABASE_URL_UNPOOLED value>"
pnpm db:seed
```

Get the value from Vercel → Settings → Environment Variables →
`DATABASE_URL_UNPOOLED` (reveal), or from the Neon dashboard.

`db:seed` migrates and seeds in one go. `.env.local` is loaded with
`override: true`, so the admin account uses `ADMIN_EMAIL` / `ADMIN_PASSWORD`
from `.env.local` — set those to your production values first (or temporarily
rename `.env.local`).

## 8. Lock down migrations

In Vercel set `AUTO_MIGRATE=false`, then redeploy. Future schema changes are
applied with `pnpm db:migrate` (or `pnpm db:seed` for a fresh database).

## 9. After the first deploy

- Open `/en/admin/sign-in`, sign in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- Change the admin password immediately from Account.
- Upload at least one homepage image + set your store phone/WhatsApp/Instagram/
  address in Settings — the seed values are placeholders.
- Confirm order emails are landing in `/en/admin/outbox` (they only land there
  until you connect Resend + verify your sending domain).

## Notes

- Receipt uploads are stored in the database (base64), no storage needed.
- Admin image uploads go to Vercel Blob (persistent, survives redeploys).
- `/public/uploads` is gitignored and only written in local dev.
- The local PGlite DB (`.data/pglite`) is gitignored and never sent to Vercel.
- Neon's pooler does not support prepared statements; the app detects pooled
  hosts and disables them automatically (`src/db/index.ts`).
- Neon Free includes ~0.5 GB storage and suspends idle computes (it wakes on the
  next request). A paid plan is not required.
