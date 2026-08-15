"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Plus, FileText, Printer, MessageCircle, CheckCircle2, HandCoins } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { SearchBar, FilterPill } from "@/components/ui/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { formatMoney, formatMonth, currentMonth, waLink } from "@/lib/utils";
import {
  feeStatusLabel,
  paymentMethodLabel,
  PAYMENT_METHODS,
} from "@/lib/constants";
import {
  recordFeeAction,
  markFeePaidAction,
  sendFeeReminderAction,
  waiveFeeAction,
} from "@/app/actions/fees";
import { downloadReceipt, printReceipt } from "@/lib/receipt-pdf";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type FeeRow = {
  id: string;
  month: string;
  monthlyFee: number;
  discount: number;
  paidAmount: number;
  balance: number;
  status: string;
  overdue?: boolean;
  paymentMethod: string | null;
  paymentDate: string | null;
  receiptNumber: string | null;
  student: {
    id: string;
    studentId: string;
    fullName: string;
    guardianName: string;
    whatsapp: string | null;
    photoUrl: string | null;
    batch: { name: string } | null;
  };
};

type PageData = {
  fees: FeeRow[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  summary: {
    totalCollected: number;
    totalDue: number;
    expected: number;
    count: number;
    overdue: number;
    overdueCount: number;
    collectionRate: number;
  };
  collections: {
    today: number;
    week: number;
    month: number;
  };
  trend: { month: string; collected: number }[];
};

type PaymentForm = {
  studentId: string;
  month: string;
  monthlyFee: number;
  discount: number;
  paidAmount: number;
  dueDate: string;
  paymentDate: string;
  paymentMethod: string;
  remarks: string;
};

const emptyForm: PaymentForm = {
  studentId: "",
  month: currentMonth(),
  monthlyFee: 0,
  discount: 0,
  paidAmount: 0,
  dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10)
    .toISOString()
    .slice(0, 10),
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: "CASH",
  remarks: "",
};

export function FeesModule({
  initialMonth,
  receiptFooter = "",
}: {
  initialMonth: string;
  receiptFooter?: string;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const [month, setMonth] = useState(initialMonth);
  const [status, setStatus] = useState("");
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PaymentForm>(emptyForm);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: string; fullName: string; studentId: string }[]>([]);
  const [waiveTarget, setWaiveTarget] = useState<FeeRow | null>(null);

  const fetchPage = useCallback(
    async (page: number) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (month) params.set("month", month);
      if (status) params.set("status", status);
      if (debouncedQ) params.set("q", debouncedQ);
      try {
        const res = await fetch(`/api/fees?${params}`, { cache: "no-store" });
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    },
    [month, status, debouncedQ]
  );

  useEffect(() => {
    const t = setTimeout(() => void fetchPage(1), 0);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const searchStudents = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/students?q=${encodeURIComponent(query)}&pageSize=8`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.students);
      }
    } finally {
      setSearching(false);
    }
  };

  const openForm = (studentId?: string) => {
    setForm({
      ...emptyForm,
      studentId: studentId ?? "",
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10)
        .toISOString()
        .slice(0, 10),
      month: currentMonth(),
    });
    setShowForm(true);
  };

  const pickStudent = (s: { id: string; fullName: string; studentId: string }) => {
    setForm((f) => ({ ...f, studentId: s.id }));
    setSearchResults([]);
    setQ("");
  };

  const submitForm = () => {
    startTransition(async () => {
      const res = await recordFeeAction({
        ...form,
        paymentDate: form.paidAmount > 0 ? form.paymentDate : null,
        paymentMethod: form.paidAmount > 0 ? form.paymentMethod : null,
      });
      if (res.ok) {
        toast(
          `Fee recorded${res.receiptNumber ? ` · Receipt ${res.receiptNumber}` : ""}`,
          "success"
        );
        setShowForm(false);
        void fetchPage(data?.page ?? 1);
      } else {
        toast(res.error, "error");
      }
    });
  };

  const markPaid = (fee: FeeRow) => {
    startTransition(async () => {
      const res = await markFeePaidAction(fee.student.id, fee.month);
      if (res.ok) {
        toast(`Marked paid · Receipt ${res.receiptNumber ?? ""}`, "success");
        void fetchPage(data?.page ?? 1);
      } else {
        toast(res.error, "error");
      }
    });
  };

  const sendReminder = async (fee: FeeRow) => {
    const res = await sendFeeReminderAction(fee.student.id, fee.month);
    if (res.ok) {
      toast("Opening WhatsApp with fee reminder…", "info");
      window.open(waLink(res.phone!, res.message!), "_blank");
    } else {
      toast(res.error, "error");
    }
  };

  const confirmWaive = () => {
    if (!waiveTarget) return;
    startTransition(async () => {
      const res = await waiveFeeAction(waiveTarget.student.id, waiveTarget.month);
      setWaiveTarget(null);
      if (res.ok) {
        toast("Fee waived", "success");
        void fetchPage(data?.page ?? 1);
      } else {
        toast(res.error, "error");
      }
    });
  };

  const downloadReceiptFor = (fee: FeeRow) => {
    const payload = {
      receiptNumber: fee.receiptNumber ?? `RCP-${fee.id.slice(0, 8)}`,
      studentName: fee.student.fullName,
      studentId: fee.student.studentId,
      guardianName: fee.student.guardianName,
      month: fee.month,
      monthlyFee: fee.monthlyFee,
      discount: fee.discount,
      paidAmount: fee.paidAmount,
      balance: fee.balance,
      paymentMethod: fee.paymentMethod,
      paymentDate: fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString("en-GB") : null,
      footerText: receiptFooter || null,
    };
    downloadReceipt(payload);
    toast("Receipt downloaded", "success");
  };

  const printReceiptFor = (fee: FeeRow) => {
    printReceipt({
      receiptNumber: fee.receiptNumber ?? `RCP-${fee.id.slice(0, 8)}`,
      studentName: fee.student.fullName,
      studentId: fee.student.studentId,
      guardianName: fee.student.guardianName,
      month: fee.month,
      monthlyFee: fee.monthlyFee,
      discount: fee.discount,
      paidAmount: fee.paidAmount,
      balance: fee.balance,
      paymentMethod: fee.paymentMethod,
      paymentDate: fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString("en-GB") : null,
      footerText: receiptFooter || null,
    });
    toast("Opening print dialog…", "info");
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Collected" value={formatMoney(data.summary.totalCollected)} tone="green" />
            <StatCard label="Due" value={formatMoney(data.summary.totalDue)} tone={data.summary.totalDue > 0 ? "red" : "green"} />
            <StatCard
              label="Overdue"
              value={formatMoney(data.summary.overdue)}
              sub={data.summary.overdueCount > 0 ? `${data.summary.overdueCount} records` : undefined}
              tone={data.summary.overdue > 0 ? "red" : "green"}
            />
            <StatCard label="Collection %" value={`${data.summary.collectionRate}%`} tone="navy" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Today's collection" value={formatMoney(data.collections.today)} tone="gold" />
            <StatCard label="This week" value={formatMoney(data.collections.week)} tone="gold" />
            <StatCard label="This month" value={formatMoney(data.collections.month)} tone="gold" />
          </div>
          {data.trend.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
                Monthly collection — last 6 months
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.trend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(m: string) => m.slice(2)}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v) => [formatMoney(Number(v)), "Collected"]}
                      labelFormatter={(l) => formatMonth(String(l))}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar dataKey="collected" fill="var(--gold)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input h-10 w-auto"
          aria-label="Month"
        />
        <FilterPill
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "PAID", label: "Paid" },
            { value: "PARTIAL", label: "Partial" },
            { value: "PENDING", label: "Pending" },
            { value: "OVERDUE", label: "Overdue" },
            { value: "WAIVED", label: "Waived" },
          ]}
        />
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search name, ID, guardian…"
          className="w-full sm:w-64"
        />
        <div className="ml-auto">
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !data || data.fees.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No fee records"
            description={
              month ? "No records for the selected month." : "Record your first fee payment."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">Fee</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Paid</th>
                  <th className="px-4 py-3 font-semibold">Balance</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Method</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.fees.map((fee) => (
                  <tr key={`${fee.student.id}-${fee.month}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{fee.student.fullName}</p>
                      <p className="text-xs text-muted">
                        {fee.student.studentId}
                        {fee.student.batch?.name ? ` · ${fee.student.batch.name}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatMonth(fee.month)}</td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">
                      {formatMoney(fee.monthlyFee)}
                      {fee.discount > 0 && (
                        <span className="ml-1 text-xs text-success">
                          -{formatMoney(fee.discount)}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-success md:table-cell">
                      {formatMoney(fee.paidAmount)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 font-medium",
                        fee.balance > 0 ? "text-danger" : "text-muted"
                      )}
                    >
                      {formatMoney(fee.balance)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted lg:table-cell">
                      {fee.paymentMethod ? paymentMethodLabel[fee.paymentMethod] : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          fee.status === "PAID"
                            ? "green"
                            : fee.status === "PARTIAL"
                              ? "amber"
                              : fee.status === "WAIVED"
                                ? "gray"
                                : fee.overdue
                                  ? "red"
                                  : "red"
                        }
                      >
                        {feeStatusLabel[fee.overdue ? "OVERDUE" : fee.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {fee.paidAmount > 0 && fee.receiptNumber && (
                          <>
                            <button
                              title="Download receipt PDF"
                              onClick={() => downloadReceiptFor(fee)}
                              className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              title="Print receipt"
                              onClick={() => printReceiptFor(fee)}
                              className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {fee.balance > 0 && (
                          <>
                            <button
                              title="Mark paid"
                              onClick={() => markPaid(fee)}
                              disabled={pending}
                              className="rounded-lg p-2 text-success transition hover:bg-success/10"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              title="Waive fee"
                              onClick={() => setWaiveTarget(fee)}
                              disabled={pending}
                              className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                            >
                              <HandCoins className="h-4 w-4" />
                            </button>
                            {fee.student.whatsapp && (
                              <button
                                title="Send WhatsApp reminder"
                                onClick={() => sendReminder(fee)}
                                className="rounded-lg p-2 text-info transition hover:bg-info/10"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={fetchPage}
          />
        )}
      </div>

      {/* Payment modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Record Fee Payment"
        size="lg"
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Student *
            </span>
            {!form.studentId ? (
              <>
                <SearchBar value={q} onChange={(v) => { setQ(v); void searchStudents(v); }} placeholder="Search student…" />
                {searching && <p className="text-xs text-muted">Searching…</p>}
                {searchResults.length > 0 && (
                  <ul className="max-h-44 overflow-auto rounded-xl border border-border bg-surface-alt">
                    {searchResults.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => pickStudent(s)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-border"
                        >
                          {s.fullName} <span className="text-xs text-muted">{s.studentId}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-alt px-3 py-2 text-sm">
                <span className="font-semibold">
                  {data?.fees.find((f) => f.student.id === form.studentId)?.student.fullName ??
                    (searchResults.find((s) => s.id === form.studentId)?.fullName ?? form.studentId)}
                </span>
                <button onClick={() => setForm((f) => ({ ...f, studentId: "" }))} className="text-xs text-danger">
                  Change
                </button>
              </div>
            )}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Month *</span>
              <input
                type="month"
                className="input"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Due Date *</span>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Monthly Fee (Rs.)</span>
              <input
                type="number"
                className="input"
                min={0}
                value={form.monthlyFee}
                onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Discount (Rs.)</span>
              <input
                type="number"
                className="input"
                min={0}
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Paid Amount (Rs.)</span>
              <input
                type="number"
                className="input"
                min={0}
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })}
              />
            </label>
            {form.paidAmount > 0 && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Payment Date</span>
                  <input
                    type="date"
                    className="input"
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Method</span>
                  <select
                    className="input"
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {paymentMethodLabel[m]}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Remarks</span>
              <input
                className="input"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={submitForm} loading={pending} disabled={!form.studentId}>
              Save Payment
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!waiveTarget}
        onClose={() => setWaiveTarget(null)}
        onConfirm={confirmWaive}
        title="Waive this fee?"
        message={`Waive the ${waiveTarget ? formatMonth(waiveTarget.month) : ""} fee of ${waiveTarget ? formatMoney(waiveTarget.balance) : ""} for ${waiveTarget?.student.fullName ?? ""}? The balance will be set to zero and the record marked as waived.`}
        confirmLabel="Waive fee"
        loading={pending}
      />
    </div>
  );
}
