# Deploying Mazzaق to Vercel (Supabase + Vercel Blob)

The repo is ready to push. This checklist covers the pieces that don't live in
the codebase: the Supabase database, the Vercel Blob token, environment
variables, and the one-time migration + seed.

Everything here fits on free plans: Vercel Hobby, Supabase Free, Vercel Blob.
Local development keeps working as before (PGlite, no services needed).

---

## 1. Push to GitHub

The repo lives at `https://github.com/youssef1G/Mazzaq` on branch `master`.

```bash
git remote add origin https://github.com/youssef1G/Mazzaq.git
git push -u origin master
```

## 2. Create the Supabase project (free)

Use the **same Supabase account/organization as the BG app**, but create a
**separate project** for Mazzaq. Do not reuse BG's project: both apps define
`products`, `categories`, `orders`, `order_items`, `settings`, and
`product_variants`, so sharing one `public` schema would corrupt BG. The free
plan allows 2 active projects per organization.

1. Go to <https://supabase.com> → sign in with the same account as BG →
   **New project**.
2. Pick the same (or nearest) organization, name it e.g. `mazzaq`, and set a
   **strong database password** (save it — you need it for the connection
   string).
3. Pick the region closest to your users, then create the project and wait for
   provisioning to finish (~2 minutes).

## 3. Get the connection strings

Project → **Settings → Database → Connection string**.

- **Transaction pooler** (port `6543`) — use for `DATABASE_URL` on Vercel.
  Serverless functions open many short-lived connections, and the transaction
  pooler handles that.
- **Direct connection** (port `5432`, or the **Session pooler**) — use for the
  one-time migration/seed from your machine.

Notes:

- If your password contains special characters, use the URL Supabase displays
  (it is already percent-encoded).
- Supabase's transaction pooler does not support prepared statements. The app
  detects the pooler and disables them automatically (`src/db/index.ts`).
- Only `DATABASE_URL` is needed. Do **not** copy BG's `SUPABASE_URL` or
  `SUPABASE_SERVICE_ROLE_KEY` — Mazzak talks to Postgres directly through
  Drizzle, and a service-role key must never be shipped to a Vercel frontend.

## 4. Create the Vercel Blob store

1. Vercel dashboard → **Storage** → **Blob** → **Create store**.
2. Connect it to the project. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.

## 5. Import the project on Vercel

1. Vercel → **Add New → Project** → import `youssef1G/Mazzaq`.
2. Framework is detected as Next.js; keep the defaults (pnpm + `next build`).
3. Set the environment variables from the next section before the first deploy.

## 6. Vercel environment variables

Add these under **Project → Settings → Environment Variables** (Production; tick
Preview/Development too if you want previews to work):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Supabase **transaction pooler** URL (port `6543`) |
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
| `AUTO_SEED` | `false` *(seeding runs manually; see step 8)* |
| `BLOB_READ_WRITE_TOKEN` | from step 4 |
| `PGLITE_DATA_DIR` | *(leave unset in production)* |

Generate the secret (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 7. Deploy

Click **Deploy**. Vercel runs `next build`; all routes render dynamically at
request time. With `AUTO_MIGRATE=true`, the first request creates the schema.

## 8. Seed the catalog + admin (required)

With `DATABASE_URL` set, the app auto-**migrates** but does **not** auto-seed
(seeding only exists in the local PGlite path). Run it once from your machine
against Supabase's **direct** connection:

```powershell
$env:DATABASE_URL="<Supabase direct/session URL>"
pnpm db:seed
```

`db:seed` migrates and seeds in one go. `.env.local` is loaded with
`override: true`, so the admin account uses `ADMIN_EMAIL` / `ADMIN_PASSWORD`
from `.env.local` — set those to your production values first (or temporarily
rename `.env.local`).

## 9. Lock down migrations

In Vercel set `AUTO_MIGRATE=false`, then redeploy. Future schema changes are
applied with `pnpm db:migrate` (or `pnpm db:seed` for a fresh database).

## 10. After the first deploy

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
- Supabase Free allows 2 active projects per organization, includes ~500 MB
  database storage, and pauses a project after 7 days with no activity. Real
  traffic keeps it awake; you can unpause it from the Supabase dashboard.
- The BG project and this one are independent — they share only the Supabase
  login, not data, keys, or connection strings.
