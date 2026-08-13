"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { attendanceLabel } from "@/lib/constants";

type HistoryRow = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LEAVE" | "LATE" | "EXCUSED";
  student: { id: string; fullName: string; studentId: string; photoUrl?: string | null };
};

export function AttendanceHistory({
  initial,
}: {
  initial: HistoryRow[];
}) {
  const [rows] = useState(initial);

  const grouped = useMemo(() => {
    const map = new Map<string, HistoryRow[]>();
    for (const r of rows) {
      const key = r.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [rows]);

  return (
    <div className="mt-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-black">
        <CalendarDays className="h-5 w-5 text-primary" /> Attendance History
      </h2>
      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No attendance yet"
            description="Records for this month will appear here."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, records]) => {
            const counts = records.reduce(
              (acc, r) => {
                acc[r.status] = (acc[r.status] ?? 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            );
            return (
              <div key={date} className="rounded-2xl border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <p className="text-sm font-bold">{formatDate(date)}</p>
                  <div className="flex gap-1.5">
                    <Badge tone="green">{counts.PRESENT ?? 0} present</Badge>
                    <Badge tone="gold">{counts.LATE ?? 0} late</Badge>
                    <Badge tone="red">{counts.ABSENT ?? 0} absent</Badge>
                    <Badge tone="blue">{counts.LEAVE ?? 0} leave</Badge>
                    <Badge tone="gray">{counts.EXCUSED ?? 0} excused</Badge>
                  </div>
                </div>
                <ul className="divide-y divide-border">
                  {records.slice(0, 12).map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-4 py-2">
                      <Avatar src={r.student.photoUrl} name={r.student.fullName} size={30} />
                      <span className="flex-1 text-sm font-medium">
                        {r.student.fullName}
                        <span className="ml-2 text-xs text-muted">
                          {r.student.studentId}
                        </span>
                      </span>
                      <Badge
                        tone={
                          r.status === "PRESENT"
                            ? "green"
                            : r.status === "ABSENT"
                              ? "red"
                              : r.status === "LATE"
                                ? "gold"
                                : r.status === "LEAVE"
                                  ? "blue"
                                  : "gray"
                        }
                      >
                        {attendanceLabel[r.status]}
                      </Badge>
                    </li>
                  ))}
                  {records.length > 12 && (
                    <li className="px-4 py-2 text-center text-xs text-muted">
                      +{records.length - 12} more
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}