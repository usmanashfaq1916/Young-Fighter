"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { FilterPill } from "@/components/ui/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate, formatMoney } from "@/lib/utils";
import {
  expenseCategoryLabel,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  paymentMethodLabel,
} from "@/lib/constants";
import {
  addExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
} from "@/app/actions/expenses";
import { useToast } from "@/components/providers/toast-provider";

type ExpenseRow = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string | null;
  notes: string | null;
};

type FormState = {
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  notes: string;
};

const defaultForm: FormState = {
  title: "",
  category: "EQUIPMENT",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "CASH",
  notes: "",
};

export function ExpensesModule() {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState("");
  const [data, setData] = useState<{
    expenses: ExpenseRow[];
    total: number;
    page: number;
    pageSize: number;
    pages: number;
    byCategory: { category: string; _sum: { amount: number | null }; _count: { _all: number } }[];
    totals: { amount: number; count: number };
    trend: { month: string; amount: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRow | null>(null);

  const fetchPage = useCallback(
    async (page: number) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (category) params.set("category", category);
      try {
        const res = await fetch(`/api/expenses?${params}`, { cache: "no-store" });
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    },
    [category]
  );

  useEffect(() => {
    const t = setTimeout(() => void fetchPage(1), 0);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const openAdd = () => {
    setEditId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (e: ExpenseRow) => {
    setEditId(e.id);
    setForm({
      title: e.title,
      category: e.category,
      amount: e.amount,
      date: e.date.slice(0, 10),
      paymentMethod: e.paymentMethod ?? "",
      notes: e.notes ?? "",
    });
    setShowForm(true);
  };

  const submit = () => {
    startTransition(async () => {
      const res = editId
        ? await updateExpenseAction(editId, form)
        : await addExpenseAction(form);
      if (res.ok) {
        toast(editId ? "Expense updated" : "Expense added", "success");
        setShowForm(false);
        void fetchPage(data?.page ?? 1);
      } else {
        toast(res.error, "error");
      }
    });
  };

  const totalSpent = data?.totals.amount ?? 0;
  const categoryTotals = new Map<string, number>();
  for (const c of data?.byCategory ?? []) {
    categoryTotals.set(c.category, c._sum.amount ?? 0);
  }

  return (
    <div className="space-y-5">
      {data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Spent" value={formatMoney(totalSpent)} tone="red" />
          <StatCard label="This Filter" value={formatMoney(data.totals.amount)} tone="navy" />
          <StatCard label="Entries" value={String(data.totals.count)} tone="gold" />
          <StatCard label="Top Category" value={data.byCategory[0]?.category ?? "—"} tone="blue" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <FilterPill
          label="Category"
          value={category}
          onChange={setCategory}
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: expenseCategoryLabel[c] }))}
        />
        <div className="ml-auto">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      {data && data.byCategory.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
              Spending by Category
            </h3>
            <div className="space-y-3">
              {data.byCategory
                .sort((a, b) => (b._sum.amount ?? 0) - (a._sum.amount ?? 0))
                .slice(0, 6)
                .map((c) => {
                  const amt = c._sum.amount ?? 0;
                  const pct = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
                  return (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="w-28 text-sm font-medium">
                        {expenseCategoryLabel[c.category]}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-danger to-gold"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-sm font-bold">
                        {formatMoney(amt)}
                      </span>
                      <span className="w-10 text-right text-xs text-muted">{pct}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
              Monthly spending — last 6 months
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(m: string) => m.slice(2)}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [formatMoney(Number(v)), "Spent"]}
                    labelFormatter={(l) => String(l)}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--gold)"
                    fill="var(--gold)"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !data || data.expenses.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title="No expenses"
            description="Record academy expenses to track spending."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">Category</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Date</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Method</th>
                  <th className="hidden px-4 py-3 font-semibold xl:table-cell">Notes</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-semibold">{e.title}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Badge tone="blue">{expenseCategoryLabel[e.category]}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">
                      {formatDate(e.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-danger">
                      {formatMoney(e.amount)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted lg:table-cell">
                      {e.paymentMethod ? paymentMethodLabel[e.paymentMethod] : "—"}
                    </td>
                    <td className="hidden max-w-52 truncate px-4 py-3 text-muted xl:table-cell">
                      {e.notes ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(e)}
                          className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(e)}
                          className="rounded-lg p-2 text-danger transition hover:bg-danger/10"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? "Edit Expense" : "Add Expense"}
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Title *</span>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. New cricket balls"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Category *</span>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {expenseCategoryLabel[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Amount (Rs.) *</span>
              <input
                type="number"
                min={0}
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Date *</span>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Payment method</span>
              <select
                className="input"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <option value="">Not recorded</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {paymentMethodLabel[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Notes</span>
              <input
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={pending} disabled={!form.title}>
              {editId ? "Save Changes" : "Add Expense"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          startTransition(async () => {
            const res = await deleteExpenseAction(deleteTarget.id);
            if (res.ok) {
              toast("Expense deleted", "success");
              void fetchPage(data?.page ?? 1);
            } else {
              toast(res.error, "error");
            }
            setDeleteTarget(null);
          });
        }}
        loading={pending}
        title="Delete expense?"
        message={`This will permanently remove "${deleteTarget?.title}".`}
        confirmLabel="Delete"
      />
    </div>
  );
}
