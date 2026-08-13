"use client";

import { useState } from "react";
import Image from "next/image";
import { QrCode, Trophy, Star, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatMoney, formatMonth, calculateAge } from "@/lib/utils";
import { attendanceLabel, feeStatusLabel, matchResultLabel, skillLabel } from "@/lib/constants";
import { generateQrDataUrl, studentQrContent } from "@/lib/qr";

type StudentData = {
  id: string;
  studentId: string;
  fullName: string;
  dob: string;
  gender: string;
  photoUrl: string | null;
  guardianName: string;
  qrToken: string;
  skillLevel: string;
  batch: { name: string } | null;
  attendance: { status: string; date: string }[];
  fees: { id: string; month: string; monthlyFee: number; discount: number; paidAmount: number; balance: number; status: string }[];
  performances: { id: string; date: string; overallRating: number; battingRating: number; bowlingRating: number; fieldingRating: number; fitnessRating: number; disciplineRating: number }[];
  matchRecords: {
    id: string;
    runs: number;
    wickets: number;
    catches: number;
    manOfTheMatch: boolean;
    match: { opponent: string; matchDate: string; result: string | null };
  }[];
};

export function StudentPortal({
  user,
  student,
  announcements,
}: {
  user: { fullName: string };
  student: StudentData | null;
  announcements: { id: string; title: string; body: string; createdAt: string }[];
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const loadQr = async () => {
    if (!student) return;
    if (!qr) setQr(await generateQrDataUrl(studentQrContent(student.qrToken), 256));
    setShowQr(true);
  };

  if (!student) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="text-lg font-black">No student profile linked</h1>
        <p className="mt-2 text-sm text-muted">
          Contact the academy administration to link your account to a student profile.
        </p>
      </div>
    );
  }

  const present = student.attendance.filter((a) => a.status === "PRESENT").length;
  const total = student.attendance.length;
  const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;
  const due = student.fees.reduce((s, f) => s + f.balance, 0);
  const lastPerf = student.performances[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.fullName}`}
        description="Your academy performance and records."
      />

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar src={student.photoUrl} name={student.fullName} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">{student.fullName}</h2>
              <Badge tone="navy">{student.studentId}</Badge>
              <Badge tone="gold">{skillLabel[student.skillLevel]}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {student.batch?.name ?? "No batch"} · Age {calculateAge(student.dob)} · Guardian:{" "}
              {student.guardianName}
            </p>
          </div>
          <button
            onClick={loadQr}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-surface-alt"
          >
            <QrCode className="h-4 w-4" /> My QR
          </button>
        </div>
      </div>

      {showQr && (
        <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
          {qr ? (
            <Image src={qr} alt="My QR" width={200} height={200} className="mx-auto rounded-xl border border-border" unoptimized />
          ) : (
            <div className="mx-auto h-48 w-48 animate-pulse rounded-xl bg-surface-alt" />
          )}
          <p className="mt-3 text-sm font-bold">{student.fullName}</p>
          <p className="text-xs text-muted">Show this to the coach to mark attendance.</p>
          <button onClick={() => setShowQr(false)} className="mt-3 text-xs font-semibold text-primary">
            Close
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Attendance" value={`${attendancePct}%`} tone="green" />
        <StatCard label="Present Days" value={present} tone="blue" />
        <StatCard label="Fee Due" value={formatMoney(due)} tone={due > 0 ? "red" : "green"} />
        <StatCard
          label="Last Rating"
          value={lastPerf ? `${lastPerf.overallRating}/10` : "—"}
          icon={<Star className="h-5 w-5" />}
          tone="gold"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Fees</h3>
          {student.fees.length === 0 ? (
            <p className="text-sm text-muted">No fee records.</p>
          ) : (
            <ul className="space-y-2">
              {student.fees.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-xl bg-surface-alt px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 text-muted" />
                    {formatMonth(f.month)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={f.balance > 0 ? "text-danger" : "text-muted"}>
                      {formatMoney(f.balance)}
                    </span>
                    <Badge tone={f.status === "PAID" ? "green" : f.status === "PARTIAL" ? "amber" : "red"}>
                      {feeStatusLabel[f.status]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted">
            <Trophy className="h-4 w-4 text-gold" /> Match Records
          </h3>
          {student.matchRecords.length === 0 ? (
            <p className="text-sm text-muted">No matches played yet.</p>
          ) : (
            <ul className="space-y-2">
              {student.matchRecords.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-xl bg-surface-alt px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold">
                      vs {m.match.opponent}
                      {m.manOfTheMatch && (
                        <Badge tone="gold" className="ml-2">
                          MOTM
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted">{formatDate(m.match.matchDate)}</p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p>
                      {m.runs} runs · {m.wickets} wkts · {m.catches} ct
                    </p>
                    {m.match.result && (
                      <Badge tone={m.match.result === "WON" ? "green" : m.match.result === "LOST" ? "red" : "gray"}>
                        {matchResultLabel[m.match.result]}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
            Recent Assessments
          </h3>
          {student.performances.length === 0 ? (
            <p className="text-sm text-muted">No assessments yet.</p>
          ) : (
            <ul className="space-y-2">
              {student.performances.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl bg-surface-alt px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold">{formatDate(p.date)}</p>
                    <p className="text-xs text-muted">
                      Bat {p.battingRating} · Bowl {p.bowlingRating} · Field {p.fieldingRating} · Fit{" "}
                      {p.fitnessRating} · Disc {p.disciplineRating}
                    </p>
                  </div>
                  <Badge tone={p.overallRating >= 7 ? "green" : p.overallRating >= 4 ? "gold" : "red"}>
                    {p.overallRating}/10
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
            Recent Attendance
          </h3>
          {student.attendance.length === 0 ? (
            <p className="text-sm text-muted">No attendance records.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {student.attendance.slice(0, 21).map((a) => (
                <div
                  key={a.date}
                  title={`${formatDate(a.date)} — ${attendanceLabel[a.status]}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    a.status === "PRESENT"
                      ? "bg-success/15 text-success"
                      : a.status === "ABSENT"
                        ? "bg-danger/15 text-danger"
                        : "bg-gold/20 text-gold-dark dark:text-gold-light"
                  }`}
                >
                  {a.status === "PRESENT" ? "P" : a.status === "ABSENT" ? "A" : "L"}
                </div>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Announcements</h3>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted">No announcements yet.</p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-xl bg-surface-alt p-3">
                <p className="text-sm font-bold">{a.title}</p>
                <p className="mt-0.5 text-sm text-muted">{a.body}</p>
                <p className="mt-1 text-xs text-muted">{formatDate(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
