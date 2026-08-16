import { Users, ClipboardCheck, TrendingUp, Trophy, Star } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { matchScopeWhere } from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth";

export async function CoachDashboard({ user }: { user: SessionUser }) {
  const today = new Date();
  const [studentCount, todayAtt, myPerformance, myMatches, recentPerf, upcomingMatches] =
    await Promise.all([
      db.student.count({ where: { coachId: user.id, deletedAt: null } }),
      db.attendance.groupBy({
        by: ["status"],
        where: { date: today, student: { coachId: user.id } },
        _count: { _all: true },
      }),
      db.performance.count({ where: { coachId: user.id } }),
      db.match.count({ where: { coachId: user.id } }),
      db.performance.findMany({
        where: { coachId: user.id },
        orderBy: { date: "desc" },
        take: 4,
        include: { student: { select: { fullName: true, photoUrl: true } } },
      }),
      db.match.findMany({
        where: { ...matchScopeWhere(user), matchDate: { gte: new Date() } },
        orderBy: { matchDate: "asc" },
        take: 3,
      }),
    ]);

  const counts: Record<string, number> = { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
  for (const g of todayAtt) counts[g.status] = g._count._all;
  const total = counts.PRESENT + counts.ABSENT + counts.LEAVE;

  const links = [
    { href: "/students", label: "My Students", icon: Users, desc: "View and manage assigned players" },
    { href: "/attendance", label: "Mark Attendance", icon: ClipboardCheck, desc: "Daily roll call" },
    { href: "/performance", label: "Add Performance", icon: TrendingUp, desc: "Rate player skills" },
    { href: "/matches", label: "Matches", icon: Trophy, desc: "Match records and player stats" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="My Students" value={studentCount} icon={<Users className="h-5 w-5" />} />
        <StatCard
          label="Today's Attendance"
          value={`${counts.PRESENT}/${total}`}
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Ratings Added"
          value={myPerformance}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard label="Matches" value={myMatches} icon={<Trophy className="h-5 w-5" />} tone="navy" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="card card-hover block p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <l.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">{l.label}</p>
            <p className="mt-0.5 text-xs text-muted">{l.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted">
            <Star className="h-4 w-4 text-gold" /> Recent Assessments
          </h3>
          {recentPerf.length === 0 ? (
            <p className="text-sm text-muted">No assessments yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentPerf.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl bg-surface-alt px-3 py-2 text-sm">
                  <Avatar src={p.student.photoUrl} name={p.student.fullName} size={28} />
                  <span className="min-w-0 flex-1 truncate font-medium">{p.student.fullName}</span>
                  <span className="text-xs text-muted">{formatDate(p.date)}</span>
                  <Badge tone={p.overallRating >= 7 ? "green" : p.overallRating >= 4 ? "gold" : "red"}>
                    {p.overallRating}/10
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted">
            <Trophy className="h-4 w-4 text-gold" /> Upcoming Matches
          </h3>
          {upcomingMatches.length === 0 ? (
            <p className="text-sm text-muted">No upcoming fixtures.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingMatches.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-xl bg-surface-alt px-3 py-2 text-sm">
                  <span className="font-semibold">vs {m.opponent}</span>
                  <span className="text-xs text-muted">
                    {formatDate(m.matchDate)}
                    {m.venue ? ` · ${m.venue}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}