"use client";

import Link from "next/link";
import { Users, Trophy, Star, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";
import { skillLabel, attendanceLabel } from "@/lib/constants";

type CoachStudent = {
  id: string;
  studentId: string;
  fullName: string;
  photoUrl: string | null;
  skillLevel: string;
  monthlyFee: number;
  batch: { name: string } | null;
};

export function CoachPortal({
  user,
  students,
  batches,
  todayAttendance,
  recentPerf,
  upcomingMatches,
}: {
  user: { fullName: string };
  students: CoachStudent[];
  batches: { id: string; name: string }[];
  todayAttendance: { studentId: string; status: string }[];
  recentPerf: {
    id: string;
    date: string;
    overallRating: number;
    student: { fullName: string; studentId: string; photoUrl: string | null };
  }[];
  upcomingMatches: { id: string; matchDate: string; opponent: string; venue: string | null }[];
}) {
  const marked = todayAttendance.length;
  const present = todayAttendance.filter((a) => a.status === "PRESENT").length;
  const unmarked = students.length - marked;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.fullName}`}
        description="Your students, batches and today's roll call."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="My Students" value={students.length} icon={<Users className="h-5 w-5" />} tone="navy" />
        <StatCard label="My Batches" value={batches.length} icon={<CalendarDays className="h-5 w-5" />} tone="gold" />
        <StatCard label="Present Today" value={present} tone="green" />
        <StatCard label="Unmarked" value={unmarked} tone={unmarked > 0 ? "red" : "green"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
              <Users className="h-4 w-4 text-primary" /> My Students
            </h3>
            <Link href="/students" className="text-xs font-semibold text-primary hover:underline">
              View all →
            </Link>
          </div>
          {students.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">
              No students assigned yet. Admin can assign students to you.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {students.slice(0, 12).map((s) => {
                const att = todayAttendance.find((a) => a.studentId === s.id);
                return (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar src={s.photoUrl} name={s.fullName} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.fullName}</p>
                      <p className="text-xs text-muted">
                        {s.studentId} · {skillLabel[s.skillLevel]}
                        {s.batch?.name ? ` · ${s.batch.name}` : ""}
                      </p>
                    </div>
                    {att ? (
                      <Badge tone={att.status === "PRESENT" ? "green" : att.status === "ABSENT" ? "red" : "gold"}>
                        {attendanceLabel[att.status]}
                      </Badge>
                    ) : (
                      <Badge tone="gray">Unmarked</Badge>
                    )}
                  </li>
                );
              })}
              {students.length > 12 && (
                <li className="px-5 py-2 text-center text-xs text-muted">
                  +{students.length - 12} more
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
              <Star className="h-4 w-4 text-gold" /> Recent Assessments
            </h3>
            {recentPerf.length === 0 ? (
              <p className="text-sm text-muted">No assessments yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentPerf.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl bg-surface-alt px-3 py-2 text-sm">
                    <Avatar src={p.student.photoUrl} name={p.student.fullName} size={28} />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {p.student.fullName}
                    </span>
                    <span className="text-xs text-muted">{formatDate(p.date)}</span>
                    <Badge tone={p.overallRating >= 7 ? "green" : p.overallRating >= 4 ? "gold" : "red"}>
                      {p.overallRating}/10
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/performance" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
              Add assessments →
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
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
            <Link href="/matches" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
              Manage matches →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
