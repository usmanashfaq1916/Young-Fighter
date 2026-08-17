import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, Users, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { ACADEMY_NAME, matchResultLabel, matchTypeLabel } from "@/lib/constants";
import { formatDatePK } from "@/lib/utils";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Breadcrumbs } from "@/components/landing/breadcrumbs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Matches",
  description:
    "Fixtures and results at Young Fighters Academy — friendly matches, tournaments and league games for our young cricketers.",
};

const resultBadge: Record<string, string> = {
  WON: "bg-success/15 text-success",
  LOST: "bg-danger/15 text-danger",
  DRAW: "bg-muted/15 text-muted",
  TIE: "bg-gold/15 text-gold-dark dark:text-gold-light",
};

export default async function MatchesPage() {
  const matches = await db.match.findMany({
    select: {
      id: true,
      matchDate: true,
      opponent: true,
      venue: true,
      matchType: true,
      result: true,
      competition: true,
      records: { select: { selected: true } },
    },
    orderBy: { matchDate: "desc" },
  });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <Breadcrumbs />

      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">
            Fixtures & results
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Our Matches
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Friendly matches and tournaments give young players real game time,
            scorecards and man-of-the-match recognition.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        {matches.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => {
              const players = m.records.filter((r) => r.selected).length;
              return (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  className="card group flex flex-col p-6 transition hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black group-hover:text-primary">
                        vs {m.opponent}
                      </h2>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                        <CalendarDays className="h-3.5 w-3.5 text-gold-dark" />
                        {formatDatePK(m.matchDate)}
                      </p>
                    </div>
                    {m.result && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${resultBadge[m.result]}`}
                      >
                        {matchResultLabel[m.result]}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                    {m.matchType && (
                      <span className="rounded-full bg-surface-alt px-2.5 py-1 font-semibold">
                        {matchTypeLabel[m.matchType]}
                      </span>
                    )}
                    {m.venue && (
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-gold-dark" />
                        {m.venue}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Users className="h-3.5 w-3.5 text-gold-dark" />
                      {players} players
                    </span>
                  </div>
                  {m.competition && (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                      {m.competition}
                    </p>
                  )}
                  <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    View scorecard
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-sm text-muted">
              Match reports will appear here as fixtures are played.
            </p>
            <Link href="/contact" className="btn-gold mt-5">
              Contact us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <LandingFooter academyName={ACADEMY_NAME} />
    </div>
  );
}