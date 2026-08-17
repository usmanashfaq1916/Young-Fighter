import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Trophy,
  Target,
  ShieldCheck,
  Star,
  CalendarDays,
  GraduationCap,
  UserRound,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  ACADEMY_NAME,
  skillLabel,
  playingRoleLabel,
  battingStyleLabel,
  bowlingStyleLabel,
} from "@/lib/constants";
import { initials, formatDatePK } from "@/lib/utils";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Breadcrumbs } from "@/components/landing/breadcrumbs";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const student = await db.student.findFirst({
    where: { id, status: "ACTIVE", deletedAt: null },
    select: { fullName: true },
  });
  return {
    title: student ? `${student.fullName} — Player Profile` : "Player Not Found",
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await db.student.findFirst({
    where: { id, status: "ACTIVE", deletedAt: null },
    select: {
      id: true,
      studentId: true,
      fullName: true,
      photoUrl: true,
      skillLevel: true,
      playingRole: true,
      battingStyle: true,
      bowlingStyle: true,
      jerseyNumber: true,
      joinDate: true,
      batch: { select: { name: true } },
      matchRecords: {
        select: {
          selected: true,
          runs: true,
          wickets: true,
          catches: true,
          manOfTheMatch: true,
        },
      },
      performances: {
        orderBy: { date: "desc" },
        take: 5,
        select: {
          date: true,
          overallRating: true,
          remarks: true,
          coach: { select: { fullName: true } },
        },
      },
    },
  });
  if (!student) notFound();

  const records = student.matchRecords.filter((r) => r.selected);
  const totals = records.reduce(
    (acc, r) => ({
      runs: acc.runs + r.runs,
      wickets: acc.wickets + r.wickets,
      catches: acc.catches + r.catches,
      motm: acc.motm + (r.manOfTheMatch ? 1 : 0),
    }),
    { runs: 0, wickets: 0, catches: 0, motm: 0 }
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <Breadcrumbs current={student.fullName} />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
          <Link
            href="/players"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/60 transition hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            All players
          </Link>
          <div className="mt-5 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            {student.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photoUrl}
                alt={student.fullName}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-white/15"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-gold-light ring-4 ring-white/15">
                {initials(student.fullName)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                {student.fullName}
              </h1>
              <p className="mt-1 text-sm font-semibold text-white/70">
                {student.studentId}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold-light">
                  {skillLabel[student.skillLevel]}
                </span>
                {student.playingRole && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/80">
                    {playingRoleLabel[student.playingRole]}
                  </span>
                )}
                {student.batch && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/80">
                    <GraduationCap className="h-3 w-3" />
                    {student.batch.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-6 text-center">
            <Trophy className="mx-auto h-6 w-6 text-gold-dark" />
            <p className="mt-2 text-3xl font-black tracking-tight">{totals.runs}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Career runs
            </p>
          </div>
          <div className="card p-6 text-center">
            <Target className="mx-auto h-6 w-6 text-gold-dark" />
            <p className="mt-2 text-3xl font-black tracking-tight">{totals.wickets}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Wickets taken
            </p>
          </div>
          <div className="card p-6 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-gold-dark" />
            <p className="mt-2 text-3xl font-black tracking-tight">{totals.catches}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Catches held
            </p>
          </div>
          <div className="card p-6 text-center">
            <Star className="mx-auto h-6 w-6 text-gold-dark" />
            <p className="mt-2 text-3xl font-black tracking-tight">{totals.motm}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Player of the match
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="card h-fit p-6 lg:col-span-1">
            <h2 className="text-base font-bold">Profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {student.playingRole && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted">
                    <UserRound className="h-4 w-4 text-gold-dark" /> Role
                  </dt>
                  <dd className="font-semibold">{playingRoleLabel[student.playingRole]}</dd>
                </div>
              )}
              {student.battingStyle && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">Batting style</dt>
                  <dd className="font-semibold">{battingStyleLabel[student.battingStyle]}</dd>
                </div>
              )}
              {student.bowlingStyle && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">Bowling style</dt>
                  <dd className="font-semibold">{bowlingStyleLabel[student.bowlingStyle]}</dd>
                </div>
              )}
              {student.jerseyNumber && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">Jersey number</dt>
                  <dd className="font-semibold">#{student.jerseyNumber}</dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-muted">
                  <CalendarDays className="h-4 w-4 text-gold-dark" /> Joined
                </dt>
                <dd className="font-semibold">{formatDatePK(student.joinDate)}</dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-base font-bold">Recent assessments</h2>
            {student.performances.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {student.performances.map((p) => (
                  <li key={p.date.toISOString()} className="card p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">{formatDatePK(p.date)}</p>
                      <p className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-bold text-gold-dark dark:text-gold-light">
                        <Star className="h-3 w-3" /> {p.overallRating.toFixed(1)} rating
                      </p>
                    </div>
                    {p.remarks && <p className="mt-2 text-sm text-muted">{p.remarks}</p>}
                    {p.coach && (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                        Coach · {p.coach.fullName}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="card mt-4 p-6 text-sm text-muted">
                Assessments will appear here as the player progresses.
              </p>
            )}
          </div>
        </div>
      </section>

      <LandingFooter academyName={ACADEMY_NAME} />
    </div>
  );
}