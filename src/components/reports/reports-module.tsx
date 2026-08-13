"use client";

import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, FileText, RefreshCw, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { makeDoc, autoTable, downloadPdf, footer } from "@/lib/pdf";
import { formatDate, formatMoney, currentMonth } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import { logReportExportAction } from "@/app/actions/misc";

type ReportData = {
  summary: {
    students: number;
    activeStudents: number;
    attendanceRecords: number;
    totalCollected: number;
    totalDue: number;
    totalExpenses: number;
    netIncome: number;
    matches: number;
  };
  studentStats: {
    id: string;
    studentId: string;
    fullName: string;
    batch: string | null;
    status: string;
    monthlyFee: number;
    attendance: { PRESENT: number; ABSENT: number; LEAVE: number };
    fees: { paid: number; due: number; count: number };
    avgRating: number;
    performanceCount: number;
  }[];
  expenses: { id: string; title: string; category: string; amount: number; date: string }[];
  matches: {
    id: string;
    matchDate: string;
    opponent: string;
    venue: string | null;
    result: string | null;
    records: { student: { id: string; fullName: string; studentId: string }; runs: number; wickets: number }[];
  }[];
};

export function ReportsModule({ role }: { role: string }) {
  const { toast } = useToast();
  const isAdmin = role === "ADMIN";
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (month) params.set("month", month);
    try {
      const res = await fetch(`/api/reports?${params}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
      else toast("Failed to load report data", "error");
    } finally {
      setLoading(false);
    }
  }, [from, to, month, toast]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const exportStudentsExcel = () => {
    if (!data) return;
    const columns: ExcelColumn<(typeof data.studentStats)[number]>[] = [
      { header: "ID", key: "id", accessor: (r) => r.studentId },
      { header: "Name", key: "name", accessor: (r) => r.fullName },
      { header: "Batch", key: "batch", accessor: (r) => r.batch ?? "" },
      { header: "Status", key: "status", accessor: (r) => r.status },
      ...(isAdmin
        ? [
            { header: "Monthly Fee", key: "fee", accessor: (r) => r.monthlyFee },
          ] as ExcelColumn<(typeof data.studentStats)[number]>[]
        : []),
      { header: "Present", key: "present", accessor: (r) => r.attendance.PRESENT },
      { header: "Absent", key: "absent", accessor: (r) => r.attendance.ABSENT },
      { header: "Leave", key: "leave", accessor: (r) => r.attendance.LEAVE },
      ...(isAdmin
        ? [
            { header: "Fees Paid", key: "paid", accessor: (r) => r.fees.paid },
            { header: "Fees Due", key: "due", accessor: (r) => r.fees.due },
          ] as ExcelColumn<(typeof data.studentStats)[number]>[]
        : []),
      { header: "Avg Rating", key: "rating", accessor: (r) => Number(r.avgRating.toFixed(2)) },
      { header: "Assessments", key: "count", accessor: (r) => r.performanceCount },
    ];
    exportToExcel(data.studentStats, columns, `students-report-${month}`);
    void logReportExportAction("EXCEL", `students ${month}`);
    toast("Students report downloaded (Excel)", "success");
  };

  const exportExpensesExcel = () => {
    if (!data) return;
    const columns: ExcelColumn<(typeof data.expenses)[number]>[] = [
      { header: "Date", key: "date", accessor: (r) => formatDate(r.date) },
      { header: "Title", key: "title", accessor: (r) => r.title },
      { header: "Category", key: "category", accessor: (r) => r.category },
      { header: "Amount", key: "amount", accessor: (r) => r.amount },
    ];
    exportToExcel(data.expenses, columns, `expenses-report-${month}`);
    void logReportExportAction("EXCEL", `expenses ${month}`);
    toast("Expenses report downloaded (Excel)", "success");
  };

  const exportMatchesExcel = () => {
    if (!data) return;
    const columns: ExcelColumn<(typeof data.matches)[number]>[] = [
      { header: "Date", key: "date", accessor: (r) => formatDate(r.matchDate) },
      { header: "Opponent", key: "opponent", accessor: (r) => r.opponent },
      { header: "Venue", key: "venue", accessor: (r) => r.venue ?? "" },
      { header: "Result", key: "result", accessor: (r) => r.result ?? "" },
      { header: "Top Scorer", key: "top", accessor: (r) => {
        const top = [...r.records].sort((a, b) => b.runs - a.runs)[0];
        return top ? `${top.student.fullName} (${top.runs})` : "";
      } },
      { header: "Top Wicket Taker", key: "bowler", accessor: (r) => {
        const top = [...r.records].sort((a, b) => b.wickets - a.wickets)[0];
        return top ? `${top.student.fullName} (${top.wickets})` : "";
      } },
    ];
    exportToExcel(data.matches, columns, `matches-report-${month}`);
    void logReportExportAction("EXCEL", `matches ${month}`);
    toast("Matches report downloaded (Excel)", "success");
  };

  const exportStudentsPdf = () => {
    if (!data) return;
    const doc = makeDoc("Student Report");
    const head = isAdmin
      ? [["ID", "Name", "Batch", "Fee", "P", "A", "L", "Paid", "Due", "Rating"]]
      : [["ID", "Name", "Batch", "Status", "P", "A", "L", "Rating"]];
    const body = isAdmin
      ? data.studentStats.map((r) => [
          r.studentId,
          r.fullName,
          r.batch ?? "—",
          r.monthlyFee.toLocaleString(),
          String(r.attendance.PRESENT),
          String(r.attendance.ABSENT),
          String(r.attendance.LEAVE),
          r.fees.paid.toLocaleString(),
          r.fees.due.toLocaleString(),
          r.avgRating.toFixed(1),
        ])
      : data.studentStats.map((r) => [
          r.studentId,
          r.fullName,
          r.batch ?? "—",
          r.status,
          String(r.attendance.PRESENT),
          String(r.attendance.ABSENT),
          String(r.attendance.LEAVE),
          r.avgRating.toFixed(1),
        ]);
    autoTable(doc, {
      startY: 40,
      head,
      body,
      headStyles: { fillColor: [11, 31, 58] },
      styles: { fontSize: 8 },
    });
    footer(doc);
    downloadPdf(doc, `students-report-${month}.pdf`);
    void logReportExportAction("PDF", `students ${month}`);
    toast("Students report downloaded (PDF)", "success");
  };

  const exportFinancialPdf = () => {
    if (!data) return;
    const doc = makeDoc("Financial Report");
    autoTable(doc, {
      startY: 40,
      head: [["Metric", "Amount (Rs.)"]],
      body: [
        ["Total collected (fees)", data.summary.totalCollected.toLocaleString()],
        ["Total due", data.summary.totalDue.toLocaleString()],
        ["Total expenses", `- ${data.summary.totalExpenses.toLocaleString()}`],
        ["Net income", data.summary.netIncome.toLocaleString()],
      ],
      headStyles: { fillColor: [15, 90, 48] },
      theme: "striped",
      styles: { fontSize: 10 },
    });
    footer(doc);
    downloadPdf(doc, `financial-report-${month}.pdf`);
    void logReportExportAction("PDF", `financial ${month}`);
    toast("Financial report downloaded (PDF)", "success");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Fee Month</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input" />
        </label>
        <Button variant="secondary" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportStudentsExcel}>
            <FileSpreadsheet className="h-4 w-4" /> Students
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={exportExpensesExcel}>
              <FileSpreadsheet className="h-4 w-4" /> Expenses
            </Button>
          )}
          <Button variant="outline" onClick={exportMatchesExcel}>
            <FileSpreadsheet className="h-4 w-4" /> Matches
          </Button>
          <Button variant="outline" onClick={exportStudentsPdf}>
            <FileText className="h-4 w-4" /> Students PDF
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={exportFinancialPdf}>
              <FileText className="h-4 w-4" /> Financial PDF
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={<BarChart3 className="h-6 w-6" />}
            title="No report data"
            description="Adjust the filters or add data first."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Students" value={data.summary.students} tone="navy" />
            {isAdmin && (
              <>
                <StatCard label="Collected" value={formatMoney(data.summary.totalCollected)} tone="green" />
                <StatCard label="Due" value={formatMoney(data.summary.totalDue)} tone={data.summary.totalDue > 0 ? "red" : "green"} />
                <StatCard label="Net Income" value={formatMoney(data.summary.netIncome)} tone={data.summary.netIncome >= 0 ? "green" : "red"} />
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Attendance Records" value={data.summary.attendanceRecords} tone="blue" />
            {isAdmin && <StatCard label="Expenses" value={formatMoney(data.summary.totalExpenses)} tone="red" />}
            <StatCard label="Matches" value={data.summary.matches} tone="gold" />
          </div>
        </>
      )}
    </div>
  );
}
