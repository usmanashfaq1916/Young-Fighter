"use client";

import { useState } from "react";
import { Medal, Trophy, Star, Target, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { playingRoleLabel } from "@/lib/constants";
import type { CareerStat, CareerCategory } from "@/lib/career-types";
import { sortCareer } from "@/lib/career-types";

const CATEGORIES: { key: CareerCategory; label: string; icon: typeof Medal }[] = [
  { key: "RUNS", label: "Runs", icon: Trophy },
  { key: "WICKETS", label: "Wickets", icon: Target },
  { key: "CATCHES", label: "Fielding", icon: ShieldCheck },
  { key: "RATING", label: "Rating", icon: Star },
  { key: "MOTM", label: "MOTM", icon: Medal },
];

const CATEGORY_TITLE: Record<CareerCategory, string> = {
  RUNS: "Most Runs",
  WICKETS: "Most Wickets",
  CATCHES: "Best Fielders",
  RATING: "Highest Performance Rating",
  MOTM: "Most Man of the Match Awards",
};

const medalTone = (rank: number): "gold" | "gray" | "blue" | "amber" =>
  rank === 1 ? "gold" : rank === 2 ? "blue" : rank === 3 ? "amber" : "gray";

export function RankingsModule({ stats }: { stats: CareerStat[] }) {
  const [cat, setCat] = useState<CareerCategory>("RUNS");
  const sorted = sortCareer(stats, cat).slice(0, 20);

  const valueOf = (s: CareerStat): string => {
    switch (cat) {
      case "RUNS":
        return `${s.runs}`;
      case "WICKETS":
        return `${s.wickets}`;
      case "CATCHES":
        return `${s.catches + s.runOuts + s.stumpings}`;
      case "RATING":
        return s.lastRating != null ? `${s.lastRating}` : "—";
      case "MOTM":
        return `${s.motm}`;
    }
  };

  const subOf = (s: CareerStat): string => {
    switch (cat) {
      case "RUNS":
        return `HS ${s.highScore} · Avg ${s.average ?? "—"} · SR ${s.strikeRate ?? "—"} · ${s.fifties}×50, ${s.hundreds}×100`;
      case "WICKETS":
        return s.bestBowling
          ? `Best ${s.bestBowling.wickets}/${s.bestBowling.runsConceded} · Econ ${s.economy ?? "—"}`
          : "No bowling figures";
      case "CATCHES":
        return `${s.catches} catches · ${s.runOuts} run outs · ${s.stumpings} stumpings`;
      case "RATING":
        return `${s.matches} matches · Latest ${s.lastRating ?? "—"}/10`;
      case "MOTM":
        return `${s.runs} runs · ${s.wickets} wickets in ${s.matches} matches`;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
              cat === c.key
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-muted hover:border-primary/40 hover:text-foreground"
            )}
          >
            <c.icon className="h-4 w-4" />
            {c.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <h3 className="border-b border-border px-4 py-3 text-sm font-bold uppercase tracking-wide text-muted">
          {CATEGORY_TITLE[cat]}
        </h3>
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-6 w-6" />}
            title="No stats yet"
            description="Record matches and scorecards to populate the leaderboard."
          />
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((s, i) => (
              <li key={s.student.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-8 text-center text-lg font-black text-muted">
                  {i + 1}
                </span>
                <Avatar src={s.student.photoUrl} name={s.student.fullName} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {s.student.fullName}
                    <span className="text-xs font-normal text-muted">
                      {s.student.studentId}
                    </span>
                    {s.student.playingRole && (
                      <Badge tone="gray">{playingRoleLabel[s.student.playingRole] ?? s.student.playingRole}</Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted">{subOf(s)}</p>
                </div>
                <Badge tone={medalTone(i + 1)}>{valueOf(s)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}