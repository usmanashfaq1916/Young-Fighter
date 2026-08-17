import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Target, ShieldCheck, Users, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { ACADEMY_NAME, skillLabel } from "@/lib/constants";
import { initials } from "@/lib/utils";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Breadcrumbs } from "@/components/landing/breadcrumbs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Players",
  description:
    "Meet the players of Young Fighters Academy — young cricketers training, competing and improving every week.",
};

export default async function PlayersPage() {
  const students = await db.student.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: {
      id: true,
      studentId: true,
      fullName: true,
      photoUrl: true,
      skillLevel: true,
      batch: { select: { name: true } },
      matchRecords: {
        select: { runs: true, wickets: true, catches: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const players = students.map((s) => ({
    ...s,
    runs: s.matchRecords.reduce((sum, r) => sum + r.runs, 0),
    wickets: s.matchRecords.reduce((sum, r) => sum + r.wickets, 0),
    catches: s.matchRecords.reduce((sum, r) => sum + r.catches, 0),
  }));

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <Breadcrumbs />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
            The squad
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Our Players
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Young cricketers training hard, competing in matches and tracking
            their progress through structured assessments.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        {players.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <Link
                key={p.id}
                href={`/players/${p.id}`}
                className="card group flex flex-col p-6 transition hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photoUrl}
                      alt={p.fullName}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-base font-black text-gold-light">
                      {initials(p.fullName)}
                    </div>
                  )}
                  <div>
                    <h2 className="font-black group-hover:text-primary">{p.fullName}</h2>
                    <p className="text-xs text-muted">{p.studentId}</p>
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold-dark dark:text-gold-light">
                      {skillLabel[p.skillLevel]}
                    </p>
                  </div>
                </div>
                {p.batch && (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    {p.batch.name}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
                  <div className="text-center">
                    <Trophy className="mx-auto h-4 w-4 text-gold-dark" />
                    <p className="mt-1 text-sm font-black">{p.runs}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Runs
                    </p>
                  </div>
                  <div className="text-center">
                    <Target className="mx-auto h-4 w-4 text-gold-dark" />
                    <p className="mt-1 text-sm font-black">{p.wickets}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Wickets
                    </p>
                  </div>
                  <div className="text-center">
                    <ShieldCheck className="mx-auto h-4 w-4 text-gold-dark" />
                    <p className="mt-1 text-sm font-black">{p.catches}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Catches
                    </p>
                  </div>
                </div>
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
                  View profile
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <Users className="h-10 w-10 text-muted" />
            <p className="text-sm text-muted">
              Player profiles will appear here as the squad grows.
            </p>
            <Link href="/apply" className="btn-gold mt-2">
              Apply for admission
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <LandingFooter academyName={ACADEMY_NAME} />
    </div>
  );
}