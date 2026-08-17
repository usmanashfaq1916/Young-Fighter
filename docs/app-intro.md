# Young Fighters Academy — App Introduction

**Young Fighters Academy (YFA)** is a production-grade cricket academy platform that
combines a public academy website with a full management system — students,
coaches, parents and staff work together in one application.

**Live:** https://young-fighters-academy.vercel.app

## What it does

| Area | Highlights |
| --- | --- |
| Public website | Home, About, Programs, Coaches, Players, Matches, Gallery, Contact, online admissions |
| Auth & roles | JWT sessions, bcrypt passwords, role dashboards (Admin / Coach / Student / Parent), password reset, session revocation |
| Students | Registration with photo, auto student IDs, QR codes, ID-card printing, batches, skill levels |
| Attendance | Daily roll call, QR scanning, offline queue support with sync |
| Fees | Monthly billing, partial payments, PDF receipts, WhatsApp reminders, status dashboard |
| Performance | Star ratings (batting / bowling / fielding / fitness / discipline), assessment history |
| Matches | Fixtures, scorecards (runs / wickets / catches / MOTM), auto stats |
| Reports | Attendance, financial, performance, match & batch reports; Excel / PDF exports |
| Extras | Expenses, goals, rankings, training packages, notifications & web push, audit logs, PWA (installable, offline) |

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
Prisma 7 + Neon Postgres · Server Actions · PWA (service worker + IndexedDB).

## Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@yfa.pk` | `admin12345` |
| Coach | `coach.ahmed@yfa.pk` | `coach12345` |
| Coach | `coach.bilal@yfa.pk` | `coach12345` |
| Parent | `parent.ali@yfa.pk` | `parent12345` |
| Student | `ali.hassan@yfa.pk` | `student12345` |

## Run it locally

```bash
npm install
npx prisma generate
npx prisma migrate dev   # applies schema to your Postgres/Neon DB
npm run seed             # loads demo data + logins
npm run dev              # http://localhost:3000
```

## Repository

Source: https://github.com/usmanashfaq1916/Young-Fighter (branch `master`).
Documentation: `docs/SRS.md` (full system requirements) and this one-page intro.