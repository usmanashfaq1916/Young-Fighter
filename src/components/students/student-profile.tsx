"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Pencil,
  QrCode,
  Printer,
  Dumbbell,
  Target,
  User as UserIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { setStudentStatusAction } from "@/app/actions/students";
import { generateQrDataUrl, studentQrContent } from "@/lib/qr";
import {
  formatMoney,
  formatDate,
  formatMonth,
  calculateAge,
  waLink,
  cn,
} from "@/lib/utils";
import {
  skillLabel,
  genderLabel,
  attendanceLabel,
  feeStatusLabel,
  paymentMethodLabel,
  matchResultLabel,
  playingRoleLabel,
  battingStyleLabel,
  bowlingStyleLabel,
  dismissalLabel,
  goalStatusLabel,
  goalCategoryLabel,
  trainingCategoryLabel,
} from "@/lib/constants";
import { useToast } from "@/components/providers/toast-provider";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  student: any;
  attendanceSummary: Record<string, number>;
  monthlyAttendance: {
    month: string;
    PRESENT: number;
    ABSENT: number;
    LEAVE: number;
    LATE: number;
    EXCUSED: number;
    total: number;
  }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fees: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  performance: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upcomingDues: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goals: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  training: any[];
  role: string;
  initialTab?: string;
};

const TABS = ["profile", "attendance", "fees", "performance", "matches", "training", "goals", "qr"] as const;
export function StudentProfile({
  student,
  attendanceSummary,
  monthlyAttendance,
  fees,
  performance,
  matches,
  upcomingDues,
  goals,
  training,
  role,
  initialTab,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = role === "ADMIN";
  const tabs = isAdmin ? TABS : TABS.filter((t) => t !== "fees");
  const [tab, setTab] = useState<string>(
    tabs.includes(initialTab as never) ? initialTab! : "overview"
  );
  const [qr, setQr] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (tab === "qr") {
      generateQrDataUrl(studentQrContent(student.qrToken), 320).then(setQr);
    }
  }, [tab, student.qrToken]);

  const paidFee = fees.reduce((s, f) => s + f.paidAmount, 0);
  const dueFee = fees.reduce((s, f) => s + f.balance, 0);
  const totalMatches = matches.length;
  const motm = matches.filter((m) => m.manOfTheMatch).length;

  const printIdCard = () => {
    try {
      const win = window.open("", "_blank");
      if (!win) {
        toast("Pop-up blocked. Allow pop-ups and try again.", "error");
        return;
      }
      const front = qr ?? "";
      win.document.write(`<!DOCTYPE html>
<html><head><title>${student.fullName} — ID Card</title>
<style>
  @page { size: 85mm 55mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  .card { width: 85mm; height: 55mm; display: flex; background: #0B1F3A; color: #fff; overflow: hidden; }
  .left { flex: 1; padding: 6mm 4mm; display: flex; flex-direction: column; justify-content: space-between; }
  .left h1 { font-size: 13px; letter-spacing: 1px; color: #F5D982; }
  .left h2 { font-size: 15px; margin-top: 2mm; }
  .left p { font-size: 10px; color: #ccc; margin-top: 1mm; }
  .left .id { font-size: 13px; font-weight: 700; color: #F5D982; }
  .right { width: 26mm; background: #0f5a30; display: flex; align-items: center; justify-content: center; padding: 2mm; }
  .right img { width: 22mm; height: 22mm; }
  .bar { height: 1.5mm; background: #d4a017; }
</style></head><body>
<div class="bar"></div>
<div class="card">
  <div class="left">
    <div>
      <h1>YOUNG FIGHTERS ACADEMY</h1>
      <h2>${student.fullName}</h2>
      <p>${student.batch?.name ?? "General"} · ${skillLabel[student.skillLevel]}</p>
      <p>Age ${calculateAge(student.dob)} · ${genderLabel[student.gender]}</p>
    </div>
    <div class="id">${student.studentId}</div>
  </div>
  <div class="right">${front ? `<img src="${front}" alt="QR"/>` : ""}</div>
</div>
<script>window.print();</script>
</body></html>`);
      win.document.close();
    } catch {
      toast("Could not open print window.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-black">Student Profile</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/students/${student.id}/edit`)}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          {student.whatsapp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  waLink(
                    student.whatsapp,
                    `Hi ${student.guardianName}, this is ${student.fullName}'s update from Young Fighters Academy.`
                  ),
                  "_blank"
                )
              }
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setTab("qr")}>
            <QrCode className="h-4 w-4" /> ID Card
          </Button>
          {role === "ADMIN" && (
            <Button
              variant={student.status === "ACTIVE" ? "danger" : "primary"}
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              {student.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </Button>
          )}
        </div>
      </div>

      {/* Header card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-navy to-gold" />
        <div className="flex flex-wrap items-center gap-5">
          <Avatar src={student.photoUrl} name={student.fullName} size={76} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">{student.fullName}</h2>
              <Badge tone={student.status === "ACTIVE" ? "green" : "red"}>
                {student.status === "ACTIVE" ? "Active" : "Inactive"}
              </Badge>
              <Badge tone="navy">{student.studentId}</Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="capitalize">
                {skillLabel[student.skillLevel]} · {genderLabel[student.gender]}
              </span>
              <span>{student.batch?.name ?? "No batch"}</span>
              <span>
                Age {calculateAge(student.dob)} · Joined {formatDate(student.joinDate)}
              </span>
              {student.coach && <span>Coach: {student.coach.fullName}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5 text-muted">
                <Phone className="h-3.5 w-3.5" /> {student.mobile}
              </span>
              {student.email && <span className="text-muted">{student.email}</span>}
              <span className="text-muted">Guardian: {student.guardianName}</span>
              {student.bloodGroup && (
                <span className="text-muted">Blood: {student.bloodGroup}</span>
              )}
            </div>
            {(student.playingRole ||
              student.battingStyle ||
              student.bowlingStyle ||
              student.jerseyNumber ||
              student.preferredPosition) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {student.playingRole && (
                  <Badge tone="navy">
                    {playingRoleLabel[student.playingRole] ?? student.playingRole}
                  </Badge>
                )}
                {student.battingStyle && (
                  <Badge tone="gold">
                    Bat: {battingStyleLabel[student.battingStyle] ?? student.battingStyle}
                  </Badge>
                )}
                {student.bowlingStyle && (
                  <Badge tone="gold">
                    Bowl: {bowlingStyleLabel[student.bowlingStyle] ?? student.bowlingStyle}
                  </Badge>
                )}
                {student.jerseyNumber && (
                  <Badge tone="green">#{student.jerseyNumber}</Badge>
                )}
                {student.preferredPosition && (
                  <Badge tone="blue" className="capitalize">
                    {student.preferredPosition}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {isAdmin && (
              <>
                <StatCard label="Monthly Fee" value={formatMoney(student.monthlyFee)} tone="navy" />
                <StatCard label="Paid" value={formatMoney(paidFee)} tone="green" />
                <StatCard label="Balance" value={formatMoney(dueFee)} tone={dueFee > 0 ? "red" : "green"} />
              </>
            )}
            <StatCard label="MOTM" value={String(motm)} tone="gold" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Attendance" value={attendanceSummary.PRESENT} tone="blue" />
        {isAdmin && (
          <>
            <StatCard label="Fees Collected" value={formatMoney(paidFee)} tone="green" />
            <StatCard label="Due Balance" value={formatMoney(dueFee)} tone={dueFee > 0 ? "red" : "green"} />
          </>
        )}
        <StatCard label="Matches Played" value={String(totalMatches)} tone="gold" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm font-semibold capitalize transition",
              tab === t
                ? "border-gold text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {tab === "profile" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {isAdmin && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
                  Upcoming Dues
                </h3>
                {upcomingDues.length === 0 ? (
                  <EmptyState
                    icon={<UserIcon className="h-6 w-6" />}
                    title="All caught up"
                    description="No pending fee dues."
                  />
                ) : (
                  <ul className="space-y-2">
                    {upcomingDues.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center justify-between rounded-xl bg-surface-alt px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{formatMonth(f.month)}</span>
                        <Badge tone={f.balance > 0 ? "amber" : "green"}>
                          {f.balance > 0
                            ? `${formatMoney(f.balance)} due`
                            : "Partial"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
                Personal Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Mobile</dt>
                  <dd className="mt-0.5 font-medium">{student.mobile}</dd>
                </div>
                {student.whatsapp && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted">WhatsApp</dt>
                    <dd className="mt-0.5 font-medium">{student.whatsapp}</dd>
                  </div>
                )}
                {student.email && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
                    <dd className="mt-0.5 font-medium">{student.email}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Guardian</dt>
                  <dd className="mt-0.5 font-medium">{student.guardianName}</dd>
                </div>
                {student.address && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs uppercase tracking-wide text-muted">Address</dt>
                    <dd className="mt-0.5 font-medium">{student.address}</dd>
                  </div>
                )}
                {student.emergencyContact && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted">Emergency Contact</dt>
                    <dd className="mt-0.5 font-medium">{student.emergencyContact}</dd>
                  </div>
                )}
                {student.coach && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted">Assigned Coach</dt>
                    <dd className="mt-0.5 font-medium">{student.coach.fullName}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Date of Birth</dt>
                  <dd className="mt-0.5 font-medium">{formatDate(student.dob)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Join Date</dt>
                  <dd className="mt-0.5 font-medium">{formatDate(student.joinDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Skill Level</dt>
                  <dd className="mt-0.5 font-medium capitalize">{skillLabel[student.skillLevel]}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Batch</dt>
                  <dd className="mt-0.5 font-medium">{student.batch?.name ?? "—"}</dd>
                </div>
              </dl>
            </div>
            {student.parentLinks && student.parentLinks.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
                  Linked Accounts
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {student.parentLinks.map((l: { id: string; parent: { fullName: string; email: string | null; mobile: string | null } }) => (
                    <div key={l.id} className="rounded-xl bg-surface-alt px-3 py-2 text-sm">
                      <p className="font-medium">{l.parent.fullName}</p>
                      <p className="text-muted">
                        {l.parent.email ?? ""}
                        {l.parent.email && l.parent.mobile ? " · " : ""}
                        {l.parent.mobile ?? ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "attendance" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
                Attendance Summary
              </h3>
              <div className="space-y-3">
                {["PRESENT", "ABSENT", "LEAVE", "LATE", "EXCUSED"].map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-medium">
                      {attendanceLabel[s]}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          s === "PRESENT"
                            ? "bg-success"
                            : s === "ABSENT"
                              ? "bg-danger"
                              : s === "LATE"
                                ? "bg-gold"
                                : s === "LEAVE"
                                  ? "bg-info"
                                  : "bg-border"
                        )}
                        style={{
                          width: `${Math.min(
                            100,
                            (attendanceSummary[s] / Math.max(1, attendanceSummary.PRESENT + attendanceSummary.ABSENT + attendanceSummary.LEAVE + attendanceSummary.LATE + attendanceSummary.EXCUSED)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-bold">
                      {attendanceSummary[s]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">
                Attendance %:{" "}
                <span className="font-bold text-foreground">
                  {(() => {
                    const present = attendanceSummary.PRESENT + attendanceSummary.LATE;
                    const total = present + attendanceSummary.ABSENT + attendanceSummary.LEAVE + attendanceSummary.EXCUSED;
                    return total > 0 ? `${Math.round((present / total) * 100)}%` : "—";
                  })()}
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card">
              <h3 className="px-5 pt-5 text-sm font-bold uppercase tracking-wide text-muted">
                Monthly Attendance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Month</th>
                      <th className="px-4 py-3 font-semibold">Present</th>
                      <th className="px-4 py-3 font-semibold">Late</th>
                      <th className="px-4 py-3 font-semibold">Absent</th>
                      <th className="px-4 py-3 font-semibold">Leave</th>
                      <th className="px-4 py-3 font-semibold">Excused</th>
                      <th className="px-4 py-3 font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {monthlyAttendance.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10">
                          <EmptyState
                            title="No attendance yet"
                            description="Attendance records will appear here."
                          />
                        </td>
                      </tr>
                    )}
                    {monthlyAttendance.map((m) => (
                      <tr key={m.month}>
                        <td className="px-4 py-3 font-medium">{formatMonth(m.month)}</td>
                        <td className="px-4 py-3">{m.PRESENT}</td>
                        <td className="px-4 py-3 text-muted">{m.LATE}</td>
                        <td className="px-4 py-3 text-danger">{m.ABSENT}</td>
                        <td className="px-4 py-3 text-muted">{m.LEAVE}</td>
                        <td className="px-4 py-3 text-muted">{m.EXCUSED}</td>
                        <td className="px-4 py-3 font-bold text-primary">
                          {m.total > 0
                            ? `${Math.round(((m.PRESENT + m.LATE) / m.total) * 100)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "fees" && (
          <div className="rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Month</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Discount</th>
                    <th className="px-4 py-3 font-semibold">Paid</th>
                    <th className="px-4 py-3 font-semibold">Balance</th>
                    <th className="px-4 py-3 font-semibold">Method</th>
                    <th className="px-4 py-3 font-semibold">Receipt</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fees.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10">
                        <EmptyState
                          title="No fee records"
                          description="Fee records will appear here once created."
                        />
                      </td>
                    </tr>
                  )}
                  {fees.map((f) => (
                    <tr key={f.id}>
                      <td className="px-4 py-3 font-medium">{formatMonth(f.month)}</td>
                      <td className="px-4 py-3">{formatMoney(f.monthlyFee)}</td>
                      <td className="px-4 py-3 text-muted">{formatMoney(f.discount)}</td>
                      <td className="px-4 py-3 text-success">{formatMoney(f.paidAmount)}</td>
                      <td className={cn("px-4 py-3", f.balance > 0 ? "text-danger" : "text-muted")}>
                        {formatMoney(f.balance)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {f.paymentMethod ? paymentMethodLabel[f.paymentMethod] : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">{f.receiptNumber ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            f.status === "PAID"
                              ? "green"
                              : f.status === "PARTIAL"
                                ? "amber"
                                : f.status === "WAIVED"
                                  ? "gray"
                                  : "red"
                          }
                        >
                          {feeStatusLabel[f.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "performance" && (
          <div className="space-y-4">
            {matches.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Matches", value: matches.length },
                  { label: "Runs", value: matches.reduce((s, m) => s + m.runs, 0) },
                  { label: "Wickets", value: matches.reduce((s, m) => s + m.wickets, 0) },
                  {
                    label: "MOTM",
                    value: matches.filter((m) => m.manOfTheMatch).length,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {s.label}
                    </p>
                    <p className="text-xl font-black text-primary">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {performance.length > 1 && (
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Rating trend
                </p>
                <svg
                  viewBox="0 0 200 40"
                  className="h-10 w-full max-w-xs"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <polyline
                    points={[...performance]
                      .reverse()
                      .map((p, i) => {
                        const x = (i / Math.max(1, performance.length - 1)) * 200;
                        const y = 36 - (p.overallRating / 10) * 32;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Bat</th>
                      <th className="px-4 py-3 font-semibold">Bowl</th>
                      <th className="px-4 py-3 font-semibold">Field</th>
                      <th className="px-4 py-3 font-semibold">Fitness</th>
                      <th className="px-4 py-3 font-semibold">Disc</th>
                      <th className="px-4 py-3 font-semibold">Overall</th>
                      <th className="px-4 py-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {performance.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10">
                          <EmptyState
                            title="No performance records"
                            description="Coach assessments will appear here."
                          />
                        </td>
                      </tr>
                    )}
                    {performance.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 text-muted">{formatDate(p.date)}</td>
                        <td className="px-4 py-3">{p.battingRating}/10</td>
                        <td className="px-4 py-3">{p.bowlingRating}/10</td>
                        <td className="px-4 py-3">{p.fieldingRating}/10</td>
                        <td className="px-4 py-3">{p.fitnessRating}/10</td>
                        <td className="px-4 py-3">{p.disciplineRating}/10</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-primary">
                            {p.overallRating}/10
                          </span>
                          {p.subSkills && (
                            <p className="mt-0.5 text-[10px] leading-tight text-muted">
                              {Object.entries(p.subSkills)
                                .map(
                                  ([k, v]) =>
                                    `${k}: ${Object.values(v as Record<string, number>).join("/")}`
                                )
                                .join(" · ")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted">{p.remarks ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "matches" && (
          <div className="rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Match</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Runs</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">Balls</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">4s/6s</th>
                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Out</th>
                    <th className="px-4 py-3 font-semibold">Wkts</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">O-R</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">Ct</th>
                    <th className="px-4 py-3 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matches.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-10">
                        <EmptyState
                          title="No matches played"
                          description="Match records will appear here."
                        />
                      </td>
                    </tr>
                  )}
                  {matches.map((m) => (
                    <tr key={m.id} className={!m.selected ? "opacity-50" : ""}>
                      <td className="px-4 py-3 font-medium">
                        {m.match.opponent}
                        {m.manOfTheMatch && (
                          <Badge tone="gold" className="ml-2">
                            MOTM
                          </Badge>
                        )}
                        {!m.selected && (
                          <span className="ml-2 text-[10px] font-bold uppercase text-muted">
                            Sub
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(m.match.matchDate)}</td>
                      <td className="px-4 py-3 font-bold text-primary">{m.runs}</td>
                      <td className="hidden px-4 py-3 text-muted sm:table-cell">
                        {m.ballsFaced ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-muted sm:table-cell">
                        {m.fours > 0 || m.sixes > 0 ? `${m.fours}/${m.sixes}` : "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-muted md:table-cell">
                        {m.dismissal ? dismissalLabel[m.dismissal] : "—"}
                      </td>
                      <td className="px-4 py-3">{m.wickets}</td>
                      <td className="hidden px-4 py-3 text-muted sm:table-cell">
                        {m.oversBowled != null ? `${m.oversBowled}-${m.runsConceded ?? 0}` : "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-muted sm:table-cell">{m.catches}</td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            m.match.result === "WON"
                              ? "green"
                              : m.match.result === "LOST"
                                ? "red"
                                : "gray"
                          }
                        >
                          {m.match.result ? matchResultLabel[m.match.result] : "—"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "training" && (
          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted">
                Training Sessions
              </h3>
            </div>
            {training.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<Dumbbell className="h-6 w-6" />}
                  title="No training records"
                  description="Training session attendance will appear here."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Session</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="hidden px-4 py-3 font-semibold sm:table-cell">Coach</th>
                      <th className="px-4 py-3 font-semibold">Attendance</th>
                      <th className="hidden px-4 py-3 font-semibold md:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {training.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold">{t.session.topic}</p>
                            <p className="text-xs text-muted">
                              {trainingCategoryLabel[t.session.category] ?? t.session.category}
                              {t.session.location ? ` · ${t.session.location}` : ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{formatDate(t.session.date)}</td>
                        <td className="hidden px-4 py-3 text-muted sm:table-cell">
                          {t.session.coach?.fullName ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={t.present ? "green" : "red"}>
                            {t.present ? "Present" : "Absent"}
                          </Badge>
                        </td>
                        <td className="hidden px-4 py-3 text-muted md:table-cell">
                          {t.notes || t.highlights || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "goals" && (
          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted">
                Development Goals
              </h3>
            </div>
            {goals.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<Target className="h-6 w-6" />}
                  title="No development goals"
                  description="Coaches can set goals for this student."
                />
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {goals.map((g) => (
                  <div key={g.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{g.title}</p>
                        <p className="text-xs text-muted">
                          {goalCategoryLabel[g.category] ?? g.category}
                          {g.coach ? ` · Coach: ${g.coach.fullName}` : ""}
                          {g.deadline ? ` · Deadline ${formatDate(g.deadline)}` : ""}
                        </p>
                      </div>
                      <Badge tone={g.status === "ACHIEVED" ? "green" : g.status === "IN_PROGRESS" ? "blue" : g.status === "CANCELLED" ? "red" : "gray"}>
                        {goalStatusLabel[g.status] ?? g.status}
                      </Badge>
                    </div>
                    {(g.baseline || g.target) && (
                      <p className="mt-2 text-sm text-muted">
                        {g.baseline && <span>From {g.baseline}</span>}
                        {g.baseline && g.target && <span> → </span>}
                        {g.target && <span className="font-semibold text-foreground">{g.target}</span>}
                      </p>
                    )}
                    {g.description && <p className="mt-2 text-sm text-muted">{g.description}</p>}
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold uppercase tracking-wide text-muted">
                          Progress
                        </span>
                        <span className="font-bold">{g.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className={g.status === "ACHIEVED" ? "h-full rounded-full bg-success" : "h-full rounded-full bg-gold"}
                          style={{ width: `${Math.min(100, Math.max(0, g.progress))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "qr" && (
          <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 text-center">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted">
              Student QR Card
            </h3>
            {qr ? (
              <Image
                src={qr}
                alt="Student QR code"
                width={260}
                height={260}
                className="mx-auto rounded-xl border border-border"
                unoptimized
              />
            ) : (
              <div className="mx-auto h-56 w-56 animate-pulse rounded-xl bg-surface-alt" />
            )}
            <p className="text-sm font-bold">{student.fullName}</p>
            <p className="text-xs text-muted">{student.studentId}</p>
            <p className="text-xs text-muted">
              Scan to mark attendance instantly.
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={printIdCard}>
                <Printer className="h-4 w-4" /> Print ID Card
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            const res = await setStudentStatusAction(
              student.id,
              student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
            );
            setConfirmOpen(false);
            if (res.ok) {
              toast(
                student.status === "ACTIVE"
                  ? "Student deactivated"
                  : "Student activated",
                "success"
              );
              router.refresh();
            } else {
              toast(res.error, "error");
            }
          })
        }
        loading={pending}
        title={student.status === "ACTIVE" ? "Deactivate student?" : "Activate student?"}
        message={`${student.fullName} will be ${
          student.status === "ACTIVE" ? "deactivated" : "reactivated"
        }.`}
        confirmLabel={student.status === "ACTIVE" ? "Deactivate" : "Activate"}
      />
    </div>
  );
}
