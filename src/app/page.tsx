import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  ClipboardCheck,
  Wallet,
  TrendingUp,
  Trophy,
  FileBarChart,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { db } from "@/lib/db";
import { ACADEMY_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description:
    "Young Fighters Academy is a complete cricket academy management platform — student registration, QR ID cards, attendance, fees, performance, matches and reports for admins, coaches, students and parents.",
};

type IconType = typeof Users;

const FEATURES: { icon: IconType; title: string; text: string }[] = [
  {
    icon: Users,
    title: "Students & QR ID cards",
    text: "Register students with photos, auto-generated IDs and printable QR cards. Guardian info, blood group, batches and skill levels in one place.",
  },
  {
    icon: ClipboardCheck,
    title: "Daily attendance",
    text: "Fast roll calls, bulk marking and QR-code scanning. Works even offline with automatic syncing when you are back online.",
  },
  {
    icon: Wallet,
    title: "Fees & receipts",
    text: "Monthly billing, discounts, partial payments and printable PDF receipts. WhatsApp payment reminders keep dues low.",
  },
  {
    icon: TrendingUp,
    title: "Performance tracking",
    text: "Star ratings for batting, bowling, fielding, fitness and discipline with a full assessment history for every student.",
  },
  {
    icon: Trophy,
    title: "Matches & scorecards",
    text: "Fixtures, results and per-student scorecards — runs, wickets, catches and man of the match for every game.",
  },
  {
    icon: FileBarChart,
    title: "Reports & exports",
    text: "Summary dashboards and one-click Excel and PDF exports for students, expenses, matches and financials.",
  },
];

const OFFERS: {
  name: string;
  price: string;
  period: string;
  tag?: string;
  featured?: boolean;
  perks: string[];
}[] = [
  {
    name: "Basic Training",
    price: "Rs 3,500",
    period: "/ month",
    tag: "For beginners",
    perks: ["2 sessions per week", "Skill assessments", "Fitness basics"],
  },
  {
    name: "Advanced Squad",
    price: "Rs 6,000",
    period: "/ month",
    tag: "Most popular",
    featured: true,
    perks: ["5 sessions per week", "Net practice & drills", "Match practice", "Priority coaching"],
  },
  {
    name: "Summer Camp",
    price: "Rs 12,000",
    period: "/ season",
    tag: "Limited seats",
    perks: ["6-week intensive program", "Daily nets & drills", "Friendly matches", "Progress report"],
  },
];

const PORTALS: { icon: IconType; role: string; text: string }[] = [
  { icon: ShieldCheck, role: "Admins", text: "Full control — students, fees, expenses, staff, reports and settings." },
  { icon: ClipboardCheck, role: "Coaches", text: "Attendance, performance, matches and their own batch of students." },
  { icon: GraduationCap, role: "Students", text: "Personal dashboard — fees, attendance and performance history." },
  { icon: Users, role: "Parents", text: "Track their child's attendance, fees and progress at a glance." },
];

export default async function HomePage() {
  const [settings, batches, activeStudents, coachCount, matchCount] = await Promise.all([
    db.setting.findMany(),
    db.batch.findMany({
      select: { name: true, description: true, coach: { select: { fullName: true } } },
      orderBy: { name: "asc" },
    }),
    db.student.count({ where: { status: "ACTIVE", deletedAt: null } }),
    db.user.count({ where: { role: "COACH", status: "ACTIVE" } }),
    db.match.count(),
  ]);

  const settingMap: Record<string, string> = {};
  for (const s of settings) settingMap[s.key] = s.value;

  const academyName = settingMap.academyName || ACADEMY_NAME;
  const phone = settingMap.academyPhone || "+92 300 0000000";
  const email = settingMap.academyEmail || "info@youngfighters.com.pk";
  const address = settingMap.academyAddress || "City Ground, Pakistan";

  const stats = [
    { label: "Active Students", value: activeStudents, icon: Users },
    { label: "Qualified Coaches", value: coachCount, icon: GraduationCap },
    { label: "Training Batches", value: batches.length, icon: ClipboardCheck },
    { label: "Matches Played", value: matchCount, icon: Trophy },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/YFA_logo.svg"
              alt="Young Fighters Academy"
              width={42}
              height={42}
              className="rounded-lg"
            />
            <div>
              <p className="text-sm font-black tracking-wide text-gold-light">
                YOUNG FIGHTERS
              </p>
              <p className="text-[10px] uppercase tracking-widest text-white/60">
                Cricket Academy
              </p>
            </div>
          </div>
          <Link href="/login" className="btn-gold">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 text-center md:pb-24 md:pt-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
            Cricket Academy Management Platform
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Where Young Fighters Become Champions
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 md:text-lg">
            {academyName} runs a complete cricket academy — and its digital home is
            built for it. Registration, attendance, fees, performance, matches and
            reports in one secure platform for admins, coaches, students and parents.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="btn-gold !px-6 !py-3 text-base">
              Sign in to your portal
            </Link>
            <a
              href="#offers"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              See our offers
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto h-6 w-6 text-gold-dark" />
              <p className="mt-2 text-3xl font-black tracking-tight">
                {s.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
            What we offer
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Everything an academy needs, in one place
          </h2>
          <p className="mt-3 text-muted">
            Powerful tools for the academy, simple experiences for students and
            parents — every day, online and offline.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 transition-shadow hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="offers" className="bg-surface-alt">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
              Offers & packages
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Pick the program that fits
            </h2>
            <p className="mt-3 text-muted">
              Flexible training packages for every level. Contact us to enroll or to
              ask about scholarships and sibling discounts.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {OFFERS.map((o) => (
              <div
                key={o.name}
                className={
                  o.featured
                    ? "relative rounded-2xl border-2 border-gold bg-surface p-6 shadow-md"
                    : "card p-6"
                }
              >
                {o.tag && (
                  <span
                    className={
                      o.featured
                        ? "badge absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gold text-navy"
                        : "badge bg-navy text-white"
                    }
                  >
                    {o.tag}
                  </span>
                )}
                <h3 className="text-lg font-black">{o.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-black tracking-tight">{o.price}</span>
                  <span className="text-sm text-muted">{o.period}</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {o.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            Sample packages — pricing and terms are updated in the code when your
            offers change.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
            Training batches
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Current training batches
          </h2>
        </div>
        {batches.length === 0 ? (
          <p className="mt-8 text-center text-muted">
            Batch schedules are added by the academy — check back soon.
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((b) => (
              <div key={b.name} className="card p-6">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-gold-dark" />
                  <h3 className="text-base font-bold">{b.name}</h3>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {b.description || "Batch training program"}
                </p>
                {b.coach && (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Coach · {b.coach.fullName}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface-alt">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
              Who it&apos;s for
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              One portal for every role
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PORTALS.map((p) => (
              <div key={p.role} className="card p-6">
                <p.icon className="h-6 w-6 text-gold-dark" />
                <h3 className="mt-3 text-base font-bold">{p.role}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="card overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="bg-gradient-to-br from-navy to-navy-light p-8 text-white md:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
                Get in touch
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">
                Ready to join Young Fighters?
              </h2>
              <p className="mt-3 text-sm text-white/75">
                Visit the academy, call or email us to enroll, or sign in to your
                existing portal.
              </p>
              <Link
                href="/login"
                className="btn-gold mt-6"
              >
                Sign in to your portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-5 bg-surface p-8 md:p-10">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Phone
                  </p>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-sm font-semibold hover:underline">
                    {phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Email
                  </p>
                  <a href={`mailto:${email}`} className="text-sm font-semibold hover:underline">
                    {email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Address
                  </p>
                  <p className="text-sm font-semibold">{address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-navy py-8 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/YFA_logo.svg"
              alt="Young Fighters Academy"
              width={28}
              height={28}
              className="rounded-md"
            />
            <p className="text-sm font-bold tracking-wide">
              {academyName}
            </p>
          </div>
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} {academyName}. All rights reserved.
          </p>
          <Link href="/login" className="text-xs font-semibold text-gold-light hover:underline">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
