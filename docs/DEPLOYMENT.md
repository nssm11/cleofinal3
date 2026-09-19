# Mise en production

Everything the shop needs to run somewhere other than a laptop, in the order
you need it. Nothing here is specific to a host: the same steps apply to a
VPS, a container platform, or a managed Node host — only the wrapper changes.

---

## 1. What the server needs

| Need | Value |
|---|---|
| Node | ≥ 20 (22 recommended — CI runs 22) |
| PostgreSQL | 17 (13+ works; `unaccent` and `pg_trgm` must be installable) |
| Disk | ~200 MB for the app, plus `public/` (45 MB, mostly video) |

Build once, then serve:

```bash
npm ci                 # never `npm install` in production: honour the lockfile
npm run build
npm run start -- --port 3000 --hostname 0.0.0.0
```

## 2. Environment

`.env` is read by Next at boot. Required in production:

```
DATABASE_URL=postgresql://user:password@host:5432/cleopatre
SESSION_SECRET=<32 random bytes>      # openssl rand -hex 32
NEXT_PUBLIC_SITE_URL=https://cleopatre.tn
TRUST_PROXY=true                      # only behind a reverse proxy you control
```

`src/lib/env.ts` **refuses to boot in production** with an absent or
example `SESSION_SECRET` (it rejects the value shipped in `.env.example`).
That is deliberate: a silent fallback would sign every session with a
published secret.

Optional, and what each one turns on:

| Variable | Effect when set |
|---|---|
| `BREVO_API_KEY` | transactional mail actually leaves; without it, letters render into `./.emails/` as HTML |
| `BREVO_WEBHOOK_SECRET` | `/api/brevo/webhook` answers; unset, it refuses (fail-closed) |
| `CRON_SECRET` | protects the outbox route (see §5) |
| `PAYMENT_METHODS_ENABLED` | comma-separated `cod`, `bank_transfer`, `gift_card` — see [PAYMENTS.md](./PAYMENTS.md) |
| `NEXT_PUBLIC_DEV_ORIGINS` | extra hostnames allowed to reach the **dev** server |
| `ALLOW_FRAMING` | dev only: lets the shop be shown inside a hosted preview frame |

## 3. Migrations — use `migrate`, not `push`

`db:push` compares the schema to the database and alters it. It is right for
development and wrong for production: it is not reviewable, not versioned,
and it will happily drop a column it thinks you removed.

```bash
npm run db:generate     # writes the next SQL file into drizzle/
# read the file — it is a migration, it deserves a review
npm run db:migrate      # applies what is not applied yet
```

The initial migration (`drizzle/0000_…sql`) is already committed, so a fresh
production database can be created from zero with `db:migrate` alone.

On a database that was pushed during development and already holds data,
baseline it once (`drizzle-kit migrate` records the applied migration in
`__drizzle_migrations`) before the first real deploy, or the first attempt
will try to re-create tables that exist.

## 4. Security headers

`next.config.ts` sends two sets:

- **every environment** — `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`;
- **production only** — `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy: same-origin`, and a `Content-Security-Policy`.

Development omits the framing headers on purpose, so the shop can be shown in
a hosted preview. Production never relaxes them.

## 5. The outbox and the daily cron

Transactional letters (order placed, dispatch, returns, OTP) are written to an
outbox table and sent by `/api/cron/outbox`. Nothing calls it by itself — put
it on a clock:

```cron
# every ten minutes
*/10 * * * * curl -fsS -H "authorization: Bearer $CRON_SECRET" https://cleopatre.tn/api/cron/outbox
```

With `CRON_SECRET` unset the route refuses, so a forgotten secret is a silent
queue, not an open endpoint. On a platform with scheduled jobs (Vercel Cron,
Render Cron, systemd timer), call the same URL with the same header.

## 6. Backups

The database is the only state that matters. Two files' worth of habit:

```bash
pg_dump --no-owner --no-acl -Fc "$DATABASE_URL" > "cleopatre-$(date +%F).dump"
```

Keep it off the app server. Test a restore — an untested backup is a rumour.

`public/images/products` and `public/videos` are static and served from the
repository; they need no backup beyond the repository itself.

## 7. Health and smoke

- `GET /api/health` — 200 when the process and the database answer.
- `node scripts/smoke.mjs https://cleopatre.tn` — 37 checks: every public door
  opens, every private door stays shut (`/compte`, `/admin` → 307 toward
  `/connexion`), a real product page renders, a missing page is a 404.

Run the smoke test right after every deploy. It is the only thing standing
between a config typo and a shop that looks fine to you and is broken for
everyone else.

## 8. Deploying behind a preview or an iframe

Next 16 rejects `/_next/*` requests from an unknown origin **in development**
(an anti-CSRF rule), which looks like an unstyled blank page with no server
error. `next.config.ts` declares `localhost`, `127.0.0.1`, `0.0.0.0`,
`*.e2b.app`, `*.e2b.dev`, plus anything in `NEXT_PUBLIC_DEV_ORIGINS`.
Production is unaffected.
