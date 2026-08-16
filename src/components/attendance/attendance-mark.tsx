"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Check,
  X,
  CalendarDays,
  Save,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import {
  markAttendanceAction,
  bulkMarkAbsentAction,
} from "@/app/actions/attendance";
import { queueOfflineWrite, useConnectivity } from "@/components/providers/connectivity-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type Status = "PRESENT" | "ABSENT" | "LEAVE" | "LATE" | "EXCUSED" | null;

type StudentRow = {
  id: string;
  studentId: string;
  fullName: string;
  photoUrl: string | null;
  batch: { name: string } | null;
  status: Status;
};

export function AttendanceMark({
  batches,
  initialMonth,
}: {
  batches: { id: string; name: string }[];
  initialMonth: string;
}) {
  const { toast } = useToast();
  const { status: conn } = useConnectivity();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchId, setBatchId] = useState("");
  const [month, setMonth] = useState(initialMonth);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [monthSummary, setMonthSummary] = useState({
    PRESENT: 0,
    ABSENT: 0,
    LEAVE: 0,
    LATE: 0,
    EXCUSED: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ date });
    if (batchId) params.set("batchId", batchId);
    params.set("month", month);
    try {
      const res = await fetch(`/api/attendance?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setMonthSummary(data.monthSummary);
      }
    } finally {
      setLoading(false);
    }
  }, [date, batchId, month]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const onSynced = () => void load();
    window.addEventListener("yfa:synced", onSynced);
    return () => window.removeEventListener("yfa:synced", onSynced);
  }, [load]);

  const setAll = (status: NonNullable<Status>) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const save = () => {
    const entries = students
      .filter((s) => s.status !== null)
      .map((s) => ({ studentId: s.id, status: s.status as NonNullable<Status> }));
    if (entries.length === 0) {
      toast("No attendance changes to save.", "error");
      return;
    }
    const payload = { date, batchId: batchId || undefined, entries };
    if (conn === "offline") {
      void queueOfflineWrite({
        action: "attendance.bulk",
        payload,
        createdAt: Date.now(),
      }).then(() => {
        toast(`Saved offline for ${entries.length} students. Will sync when back online.`, "success");
      });
      return;
    }
    startTransition(async () => {
      try {
        const res = await markAttendanceAction(payload);
        if (res.ok) {
          toast(`Attendance saved for ${res.count} students`, "success");
          window.dispatchEvent(new Event("yfa:sync"));
          void load();
        } else {
          toast(res.error, "error");
        }
      } catch {
        // Network failure while navigator.onLine was true — queue it so the
        // save is not lost.
        void queueOfflineWrite({
          action: "attendance.bulk",
          payload,
          createdAt: Date.now(),
        }).then(() => {
          toast("Connection lost — saved offline. Will sync when back online.", "info");
        });
      }
    });
  };

  const markAllAbsent = () => {
    if (conn === "offline") {
      void queueOfflineWrite({
        action: "attendance.bulk",
        payload: {
          date,
          batchId: batchId || undefined,
          entries: students.map((s) => ({ studentId: s.id, status: "ABSENT" as const })),
        },
        createdAt: Date.now(),
      }).then(() => toast("Saved offline. Will sync when back online.", "success"));
      return;
    }
    startTransition(async () => {
      try {
        const res = await bulkMarkAbsentAction({ date, batchId: batchId || undefined });
        if (res.ok) {
          toast(`Marked ${res.count} students absent`, "success");
          void load();
        } else {
          toast(res.error, "error");
        }
      } catch {
        void queueOfflineWrite({
          action: "attendance.bulk",
          payload: {
            date,
            batchId: batchId || undefined,
            entries: students.map((s) => ({ studentId: s.id, status: "ABSENT" as const })),
          },
          createdAt: Date.now(),
        }).then(() => {
          toast("Connection lost — saved offline. Will sync when back online.", "info");
        });
      }
    });
  };

  const counts = students.reduce(
    (acc, s) => {
      if (s.status) acc[s.status]++;
      return acc;
    },
    { PRESENT: 0, ABSENT: 0, LEAVE: 0, LATE: 0, EXCUSED: 0 }
  );
  const totalMarked =
    counts.PRESENT + counts.ABSENT + counts.LEAVE + counts.LATE + counts.EXCUSED;
  const totalStudents = students.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Batch
          </span>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="input"
          >
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Month (stats)
          </span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input"
          />
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAll("PRESENT")}>
            <Check className="h-4 w-4" /> All Present
          </Button>
          <Button variant="outline" onClick={markAllAbsent} disabled={pending}>
            <X className="h-4 w-4" /> All Absent
          </Button>
          <Button onClick={save} loading={pending}>
            <Save className="h-4 w-4" /> Save ({totalMarked})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={totalStudents} icon={<Users className="h-5 w-5" />} tone="navy" />
        <StatCard label="Present" value={counts.PRESENT} icon={<Check className="h-5 w-5" />} tone="green" />
        <StatCard label="Absent" value={counts.ABSENT} icon={<X className="h-5 w-5" />} tone="red" />
        <StatCard
          label="Month (P/L/A)"
          value={`${monthSummary.PRESENT}/${monthSummary.LATE}/${monthSummary.ABSENT}`}
          icon={<CalendarDays className="h-5 w-5" />}
          tone="gold"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No active students"
            description="Register students or add them to a batch to start marking attendance."
          />
        ) : (
          <ul className="divide-y divide-border">
            {students.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar src={s.photoUrl} name={s.fullName} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.fullName}</p>
                  <p className="text-xs text-muted">
                    {s.studentId}
                    {s.batch?.name ? ` · ${s.batch.name}` : ""}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {(["PRESENT", "ABSENT", "LEAVE", "LATE", "EXCUSED"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStudents((prev) =>
                          prev.map((x) =>
                            x.id === s.id
                              ? { ...x, status: x.status === status ? null : status }
                              : x
                          )
                        );
                      }}
                      title={status}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        s.status === status
                          ? status === "PRESENT"
                            ? "bg-success text-white"
                            : status === "ABSENT"
                              ? "bg-danger text-white"
                              : status === "LATE"
                                ? "bg-gold text-navy"
                                : status === "LEAVE"
                                  ? "bg-info text-white"
                                  : "bg-border text-foreground"
                          : "bg-surface-alt text-muted hover:bg-border"
                      )}
                    >
                      {status === "PRESENT"
                        ? "P"
                        : status === "ABSENT"
                          ? "A"
                          : status === "LEAVE"
                            ? "L"
                            : status === "LATE"
                              ? "Lt"
                              : "E"}
                    </button>
                  ))}
                </div>
                <span className="hidden w-24 text-right text-xs text-muted sm:block">
                  {s.status ? (
                    <Badge
                      tone={
                        s.status === "PRESENT"
                          ? "green"
                          : s.status === "ABSENT"
                            ? "red"
                            : s.status === "LATE"
                              ? "gold"
                              : s.status === "LEAVE"
                                ? "blue"
                                : "gray"
                      }
                    >
                      {s.status}
                    </Badge>
                  ) : (
                    "Not marked"
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}