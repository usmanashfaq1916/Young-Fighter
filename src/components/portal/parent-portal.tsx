"use client";

import { useState } from "react";
import Image from "next/image";
import { GraduationCap, Bell, Star, MessageCircle, Target, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatMoney, formatMonth, calculateAge, waLink } from "@/lib/utils";
import { feeStatusLabel, skillLabel, goalStatusLabel, goalCategoryLabel, trainingCategoryLabel } from "@/lib/constants";
import { generateQrDataUrl, studentQrContent } from "@/lib/qr";

type ChildData = {
  id: string;
  studentId: string;
  fullName: string;
  dob: string;
  gender: string;
  photoUrl: string | null;
  whatsapp: string | null;
  guardianName: string;
  qrToken: string;
  skillLevel: string;
  batch: { name: string } | null;
  attendance: { status: string; date: string }[];
  fees: { id: string; month: string; monthlyFee: number; discount: number; paidAmount: number; balance: number; status: string }[];
  performances: { id: string; date: string; overallRating: number; battingRating: number; bowlingRating: number; fieldingRating: number; fitnessRating: number; disciplineRating: number }[];
  goals: {
    id: string;
    title: string;
    category: string;
    baseline: string | null;
    target: string | null;
    progress: number;
    status: string;
    deadline: string | null;
  }[];
  trainingRecords: {
    id: string;
    present: boolean;
    session: { date: string; topic: string; category: string };
  }[];
};

export function ParentPortal({
  user,
  students,
  announcements,
}: {
  user: { fullName: string };
  students: ChildData[];
  announcements: { id: string; title: string; body: string; createdAt: string }[];
}) {
  const [qr, setQr] = useState<Record<string, string>>({});

  const loadQr = async (id: string, token: string) => {
    if (qr[id]) return;
    const url = await generateQrDataUrl(studentQrContent(token), 200);
    setQr((prev) => ({ ...prev, [id]: url }));
  };

  const totalDue = students.reduce((s, c) => s + c.fees.reduce((x, f) => x + f.balance, 0), 0);
  const totalPresent = students.reduce(
    (s, c) => s + c.attendance.filter((a) => a.status === "PRESENT").length,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.fullName}`}
        description="Track your children's progress, fees and attendance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Linked Children" value={students.length} icon={<GraduationCap className="h-5 w-5" />} tone="navy" />
        <StatCard label="Present (recent)" value={totalPresent} tone="green" />
        <StatCard label="Total Due" value={formatMoney(totalDue)} tone={totalDue > 0 ? "red" : "green"} />
        <StatCard label="Announcements" value={announcements.length} icon={<Bell className="h-5 w-5" />} tone="gold" />
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted">
          No children linked yet. Contact the academy to link your account.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {students.map((child) => {
            const paid = child.fees.reduce((s, f) => s + f.paidAmount, 0);
            const due = child.fees.reduce((s, f) => s + f.balance, 0);
            const lastPerf = child.performances[0];
            return (
              <div key={child.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-4">
                  <Avatar src={child.photoUrl} name={child.fullName} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-black">{child.fullName}</h3>
                      <Badge tone={child.batch?.name ? "navy" : "gray"}>
                        {child.batch?.name ?? "No batch"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted">
                      {child.studentId} · {skillLabel[child.skillLevel]} · Age{" "}
                      {calculateAge(child.dob)}
                    </p>
                  </div>
                  {child.whatsapp && (
                    <a
                      href={waLink(child.whatsapp, `Hi, this is ${user.fullName} regarding ${child.fullName}.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-border p-2.5 text-info transition hover:bg-info/10"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <StatCard label="Paid" value={formatMoney(paid)} tone="green" />
                  <StatCard label="Due" value={formatMoney(due)} tone={due > 0 ? "red" : "green"} />
                  <StatCard label="Last Rating" value={lastPerf ? `${lastPerf.overallRating}/10` : "—"} tone="gold" />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onMouseEnter={() => void loadQr(child.id, child.qrToken)}
                    className="relative shrink-0"
                    title="Student QR"
                  >
                    {qr[child.id] ? (
                      <Image src={qr[child.id]} alt="QR" width={72} height={72} className="rounded-lg border border-border" unoptimized />
                    ) : (
                      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-lg bg-surface-alt text-xs text-muted">
                        QR
                      </div>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">
                      Recent Fees
                    </p>
                    {child.fees.length === 0 ? (
                      <p className="text-xs text-muted">No fee records.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {child.fees.map((f) => (
                          <li key={f.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted">{formatMonth(f.month)}</span>
                            <Badge
                              tone={
                                f.status === "PAID"
                                  ? "green"
                                  : f.status === "PARTIAL"
                                    ? "amber"
                                    : "red"
                              }
                            >
                              {feeStatusLabel[f.status]} · {formatMoney(f.balance)}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {lastPerf && (
                  <div className="mt-4 rounded-xl bg-surface-alt p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
                      <Star className="h-3.5 w-3.5 text-gold" /> Latest Assessment (
                      {formatDate(lastPerf.date)})
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge tone="blue">Bat {lastPerf.battingRating}</Badge>
                      <Badge tone="blue">Bowl {lastPerf.bowlingRating}</Badge>
                      <Badge tone="blue">Field {lastPerf.fieldingRating}</Badge>
                      <Badge tone="blue">Fitness {lastPerf.fitnessRating}</Badge>
                      <Badge tone="blue">Disc {lastPerf.disciplineRating}</Badge>
                    </div>
                  </div>
                )}

                {child.goals.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
                      <Target className="h-3.5 w-3.5 text-gold" /> Development Goals
                    </p>
                    <ul className="space-y-2">
                      {child.goals.slice(0, 3).map((g) => (
                        <li key={g.id} className="rounded-xl bg-surface-alt p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{g.title}</p>
                            <Badge tone={g.status === "ACHIEVED" ? "green" : g.status === "IN_PROGRESS" ? "blue" : "gray"}>
                              {goalStatusLabel[g.status] ?? g.status}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            {goalCategoryLabel[g.category] ?? g.category}
                            {g.deadline ? ` · Due ${formatDate(g.deadline)}` : ""}
                          </p>
                          <div className="mt-2">
                            <div className="mb-1 flex justify-between text-[10px]">
                              <span className="font-semibold uppercase text-muted">Progress</span>
                              <span className="font-bold">{g.progress}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-border">
                              <div
                                className="h-full rounded-full bg-gold"
                                style={{ width: `${Math.min(100, Math.max(0, g.progress))}%` }}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {child.trainingRecords.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
                      <Dumbbell className="h-3.5 w-3.5 text-gold" /> Recent Training
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {child.trainingRecords.slice(0, 10).map((t) => (
                        <li
                          key={t.id}
                          title={`${t.session.topic} — ${formatDate(t.session.date)}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                        >
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              t.present ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                            }`}
                          >
                            {t.present ? "P" : "A"}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-[10px] text-muted">
                      {child.trainingRecords.filter((t) => t.present).length}/
                      {child.trainingRecords.length} of recent sessions attended (
                      {trainingCategoryLabel[child.trainingRecords[0].session.category] ?? "Training"})
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
          <Bell className="h-4 w-4 text-gold" /> Announcements
        </h3>
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
