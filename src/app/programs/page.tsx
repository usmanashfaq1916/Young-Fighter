import type { Metadata } from "next";
import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { db } from "@/lib/db";
import { ACADEMY_NAME, billingTypeLabel } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Breadcrumbs } from "@/components/landing/breadcrumbs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Explore training programs and packages at Young Fighters Academy — structured coaching, fitness and match exposure for young cricketers.",
};

export default async function ProgramsPage() {
  const [packages, batches] = await Promise.all([
    db.package.findMany({
      where: { isActive: true },
      orderBy: [{ price: "asc" }, { name: "asc" }],
    }),
    db.batch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        trainingDays: true,
        trainingTime: true,
        trainingLocation: true,
        coach: { select: { fullName: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <Breadcrumbs />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
            Programs & training
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Coaching that grows with the player
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Beginners learn fundamentals in a supportive environment; advanced
            players sharpen technique, cricket sense and match temperament.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
            Training packages
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Programs that fit your child&apos;s journey
          </h2>
          <p className="mt-3 text-muted">
            Current packages offered by the academy. Details are confirmed with
            your batch placement.
          </p>
        </div>

        {packages.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((p) => (
              <div key={p.id} className="card flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black">{p.name}</h3>
                  {p.sessionsPerWeek > 0 && (
                    <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-bold text-gold-dark dark:text-gold-light">
                      {p.sessionsPerWeek}/week
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-black tracking-tight text-primary">
                  {formatMoney(p.price)}
                  <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    / {billingTypeLabel[p.billingType].toLowerCase()}
                  </span>
                </p>
                {p.description && (
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {p.description}
                  </p>
                )}
                {p.features.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-5">
                  <Link
                    href={`/programs/${p.id}`}
                    className="btn-outline-dark w-full justify-center"
                  >
                    View program details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card mt-10 p-10 text-center">
            <p className="text-sm text-muted">
              Program details are confirmed with your batch placement. Contact
              us for the current schedule and fees.
            </p>
            <Link href="/contact" className="btn-gold mt-5">
              Contact us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <section className="bg-surface-alt">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">
              Training batches
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Current training batches
            </h2>
            <p className="mt-3 text-muted">
              Players are placed in batches suited to their age and level, each
              led by an experienced coach.
            </p>
          </div>
          {batches.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {batches.map((b) => (
                <div key={b.id} className="card p-6">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-gold-dark" />
                    <h3 className="text-base font-bold">{b.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {b.description || "Batch training program"}
                  </p>
                  {(b.trainingDays || b.trainingTime || b.trainingLocation) && (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-surface-alt px-2.5 py-1.5 text-xs font-semibold text-foreground">
                      <CalendarDays className="h-3.5 w-3.5 text-gold-dark" />
                      {[b.trainingDays, b.trainingTime, b.trainingLocation]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {b.coach && (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                      Coach · {b.coach.fullName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="card mt-10 p-10 text-center text-sm text-muted">
              Batch schedules are confirmed at admission.
            </p>
          )}
          <div className="mt-10 text-center">
            <Link href="/apply" className="btn-gold">
              Apply for admission
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter academyName={ACADEMY_NAME} />
    </div>
  );
}