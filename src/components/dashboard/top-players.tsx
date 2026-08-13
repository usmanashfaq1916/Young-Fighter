"use client";

import Link from "next/link";
import { Trophy, Medal } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { skillLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TopPlayers({
  players,
}: {
  players: {
    id: string;
    studentId: string;
    name: string;
    photoUrl: string | null;
    skillLevel: string;
    overallRating: number;
  }[];
}) {
  const rankStyles = [
    "bg-gradient-to-b from-gold-light to-gold text-navy",
    "bg-surface-alt text-muted border border-border",
    "bg-[#cd7f32]/20 text-[#cd7f32]",
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Top 5 Players</h3>
          <p className="text-xs text-muted">Ranked by overall performance rating</p>
        </div>
        <Trophy className="h-5 w-5 text-gold" />
      </div>
      <ol className="divide-y divide-border">
        {players.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/students/${p.id}`}
              className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface-alt"
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
                  rankStyles[i] ?? rankStyles[1]
                )}
              >
                {i === 0 ? <Medal className="h-4 w-4" /> : i + 1}
              </span>
              <Avatar src={p.photoUrl} name={p.name} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                <p className="text-[11px] text-muted">
                  {p.studentId} · <Badge tone="gold">{skillLabel[p.skillLevel]}</Badge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-foreground">
                  {p.overallRating.toFixed(1)}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  Overall
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}