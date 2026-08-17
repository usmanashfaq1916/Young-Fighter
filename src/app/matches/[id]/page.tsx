import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  CalendarDays,
  MapPin,
  Trophy,
  Users,
  Target,
  ShieldCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  ACADEMY_NAME,
  matchResultLabel,
  matchTypeLabel,
  dismissalLabel,
} from "@/lib/constants";
import { formatDatePK } from "@/lib/utils";
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
  const match = await db.match.findUnique({
    where: { id },
    select: { opponent: true },
  });
  return {
    title: match ? `vs ${match.opponent} — Match Report` : "Match Not Found",
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await db.match.findUnique({
    where: { id },
    include: {
      records: {
        where: { selected: true },
        include: { student: { select: { fullName: true } } },
        orderBy: { battingPosition: "asc" },
      },
    },
  });
  if (!match) notFound();

  const totals = match.records.reduce(
    (acc, r) => ({
      runs: acc.runs + r.runs,
      wickets: acc.wickets + r.wickets,
      catches: acc.catches + r.catches,
    }),
    { runs: 0, wickets: 0, catches: 0 }
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <Breadcrumbs current={`vs ${match.opponent}`} />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
          <Link
            href="/matches"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/60 transition hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            All matches
          </Link>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            vs {match.opponent}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-gold-light" />
              {formatDatePK(match.matchDate)}
            </span>
            {match.venue && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gold-light" />
                {match.venue}
              </span>
            )}
            {match.matchType && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold">
                {matchTypeLabel[match.matchType]}
              </span>
            )}
            {match.result && (
              <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold-light">
                Result: {matchResultLabel[match.result]}
              </span>
            )}
          </div>
          {match.competition && (
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/60">
              {match.competition}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-6 text-center">
            <Trophy className="mx-auto h-6 w-6 text-gold-dark" />
            <p className="mt-2 text-3xl font-black tracking-tight">{totals.runs}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Team runs
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
        </div>

        {match.notes && (
          <div className="card mt-8 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
              Match notes
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{match.notes}</p>
          </div>
        )}

        <div className="card mt-8 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Users className="h-5 w-5 text-gold-dark" />
              Scorecard
            </h2>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {match.records.length} players
            </span>
          </div>
          {match.records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                    <th className="px-5 py-3">Player</th>
                    <th className="px-3 py-3 text-center">Runs</th>
                    <th className="px-3 py-3 text-center">Balls</th>
                    <th className="px-3 py-3 text-center">4s</th>
                    <th className="px-3 py-3 text-center">6s</th>
                    <th className="px-3 py-3 text-center">Dismissal</th>
                    <th className="px-3 py-3 text-center">Wickets</th>
                    <th className="px-3 py-3 text-center">Overs</th>
                    <th className="px-3 py-3 text-center">Catches</th>
                    <th className="px-5 py-3 text-center">MOTM</th>
                  </tr>
                </thead>
                <tbody>
                  {match.records.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-semibold">{r.student.fullName}</td>
                      <td className="px-3 py-3 text-center font-bold">{r.runs}</td>
                      <td className="px-3 py-3 text-center text-muted">
                        {r.ballsFaced ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-center text-muted">{r.fours || "—"}</td>
                      <td className="px-3 py-3 text-center text-muted">{r.sixes || "—"}</td>
                      <td className="px-3 py-3 text-center text-muted">
                        {r.dismissal ? dismissalLabel[r.dismissal] : "—"}
                      </td>
                      <td className="px-3 py-3 text-center font-bold">{r.wickets || "—"}</td>
                      <td className="px-3 py-3 text-center text-muted">
                        {r.oversBowled != null ? r.oversBowled : "—"}
                      </td>
                      <td className="px-3 py-3 text-center font-bold">{r.catches || "—"}</td>
                      <td className="px-5 py-3 text-center">
                        {r.manOfTheMatch ? (
                          <Trophy className="mx-auto h-4 w-4 text-gold-dark" />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-sm text-muted">
              The scorecard for this match has not been recorded yet.
            </p>
          )}
        </div>
      </section>

      <LandingFooter academyName={ACADEMY_NAME} />
    </div>
  );
}