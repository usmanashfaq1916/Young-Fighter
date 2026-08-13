# Young Fighters Academy (YFA)

A full-featured cricket academy management system and PWA built with
**Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Neon Postgres (Prisma 7)**.

## Features

| Module | Highlights |
| --- | --- |
| **Auth & RBAC** | JWT sessions, bcrypt, role-based access (Admin / Coach / Student / Parent), password reset, session revocation |
| **Students** | Registration with photo, auto student IDs, QR codes, ID card printing, profiles, guardian info, blood group, batches, skill levels |
| **Attendance** | Daily roll call, bulk mark-absent, QR-code scanning, history, offline queue support |
| **Fees** | Monthly billing, discounts, partial payments, PDF receipts, WhatsApp payment reminders, fee status dashboard |
| **Performance** | Star ratings (batting / bowling / fielding / fitness / discipline), assessment history |
| **Matches** | Fixtures with opponent/venue/result, per-student scorecards (runs, wickets, catches, MOTM) |
| **Expenses** | Categorized expenses (equipment, ground, transport, salaries…), monthly analytics |
| **Reports** | Summary stats, Excel exports (students / expenses / matches), PDF exports (students / financial) |
| **Portals** | Separate dashboards for Admins, Coaches, Students and Parents |
| **Notifications** | In-app notifications, announcements, Web Push (VAPID), offline-capable |
| **PWA** | Installable manifest, service worker precache, offline shell |

## Tech Stack

- Next.js 16.3 (Turbopack, App Router, `src/proxy.ts` middleware, `useOffline`)
- React 19, TypeScript 5
- Tailwind CSS v4 + custom YFA design system (navy/gold theme)
- Prisma 7 (PostgreSQL via Neon) with the **Pg driver adapter** (`@prisma/adapter-pg`)
- react-hook-form + zod, TanStack Table, Recharts, jsPDF, SheetJS (xlsx), qrcode, web-push, IndexedDB (idb)

## Getting Started

```bash
npm install
npx prisma generate

# 1. Create a Neon Postgres database, copy .env.example → .env.local, fill DATABASE_URL
# 2. Create the schema
npx prisma migrate dev

# 3. Seed demo data (admin/coach/parent/student logins are printed)
npm run seed

# 4. Run
npm run dev
```

Default seeded logins (see `prisma/seed.ts` for overrides via `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@yfa.pk` | `admin12345` |
| Coach | `coach.ahmed@yfa.pk` | `coach12345` |
| Parent | `parent.ali@yfa.pk` | `parent12345` |
| Student | `ali.hassan@yfa.pk` | `student12345` |

## Scripts

```bash
npm run dev          # development server
npm run build        # production build (typechecks + compiles)
npm run start        # run production build
npm run lint         # eslint
npm run test         # vitest unit tests
npm run seed         # run prisma/seed.ts (requires DATABASE_URL)
```

## Project Structure

```
prisma/schema.prisma      # Database schema (PostgreSQL)
prisma/seed.ts            # Demo data (admin, coaches, students, fees, matches…)
src/proxy.ts              # Middleware: auth redirects + role-based routing
src/lib/                  # db, auth, session, rbac, notifications, push, pdf, excel, qr…
src/app/actions/          # Server actions (mutations)
src/app/api/              # Route handlers (queries, scan API, offline replay)
src/app/(app)/            # Protected pages (dashboard, students, attendance, fees, portals…)
src/components/           # UI kit (ui/) + feature components
public/sw.js              # Service worker (precache + push)
public/manifest.webmanifest
```

## Environment Variables

All variables are documented in `.env.example`. Key ones:

- `DATABASE_URL` — Neon Postgres connection string (required)
- `AUTH_SECRET` — random 32+ byte secret for JWT sessions (required)
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — admin login for `npm run seed`
- `NEXT_PUBLIC_APP_URL` — used in QR codes and reset links
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob for photo uploads (empty = local disk in dev)
- `RESEND_API_KEY` — transactional email for password reset
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT_EMAIL` — web push
- `FIREBASE_SERVICE_ACCOUNT_JSON` — optional FCM service account

## Deployment

1. Provision a Neon Postgres database and push the schema:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```
2. Deploy to Vercel with the `.env` values above.
3. Create the database (Neon) first — migrations run via `prisma migrate deploy` in the build
   process (`postinstall` or CI), not at runtime.
4. Note: local-file photo uploads do not persist on serverless; set `BLOB_READ_WRITE_TOKEN`
   for durable uploads.

## Notes

- Prisma 7 requires a driver adapter; the Pg adapter is configured in `src/lib/db.ts`.
- The generated Prisma client lives in `src/generated/prisma` and is git-ignored
  (`npx prisma generate` after clone).
- The schema is authoritative — regenerate the client after any `schema.prisma` change.
