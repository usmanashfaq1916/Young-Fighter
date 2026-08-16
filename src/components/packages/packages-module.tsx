"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Package as PackageIcon, Power } from "lucide-react";
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
import { BILLING_TYPES, billingTypeLabel } from "@/lib/constants";
import {
  createPackageAction,
  updatePackageAction,
  deletePackageAction,
  togglePackageAction,
} from "@/app/actions/packages";
import { useToast } from "@/components/providers/toast-provider";

type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billingType: string;
  sessionsPerWeek: number;
  features: string[];
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
};

type FormState = {
  name: string;
  description: string;
  price: number;
  billingType: string;
  sessionsPerWeek: number;
  features: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

const defaultForm: FormState = {
  name: "",
  description: "",
  price: 0,
  billingType: "MONTHLY",
  sessionsPerWeek: 0,
  features: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export function PackagesModule() {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState("");
  const [data, setData] = useState<{
    packages: PackageRow[];
    total: number;
    page: number;
    pageSize: number;
    pages: number;
    activeCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<PackageRow | null>(null);

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    try {
      const res = await fetch(`/api/packages?${params}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const t = setTimeout(() => void fetchPage(1), 0);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const openAdd = () => {
    setEditId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (p: PackageRow) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      billingType: p.billingType,
      sessionsPerWeek: p.sessionsPerWeek,
      features: p.features.join("\n"),
      startDate: p.startDate ? p.startDate.slice(0, 10) : "",
      endDate: p.endDate ? p.endDate.slice(0, 10) : "",
      isActive: p.isActive,
    });
    setShowForm(true);
  };

  const submit = () => {
    startTransition(async () => {
      const input = {
        name: form.name,
        description: form.description,
        price: form.price,
        billingType: form.billingType,
        sessionsPerWeek: form.sessionsPerWeek,
        features: form.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isActive: form.isActive,
      };
      const res = editId
        ? await updatePackageAction(editId, input)
        : await createPackageAction(input);
      if (res.ok) {
        toast(editId ? "Package updated" : "Package created", "success");
        setShowForm(false);
        void fetchPage(data?.page ?? 1);
      } else {
        toast(res.error, "error");
      }
    });
  };

  return (
    <div className="space-y-5">
      {data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="Total Packages" value={String(data.total)} tone="navy" />
          <StatCard label="Active" value={String(data.activeCount)} tone="green" />
          <StatCard label="Inactive" value={String(data.total - data.activeCount)} tone="gold" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <FilterPill
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />
        <div className="ml-auto">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Package
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
        ) : !data || data.packages.length === 0 ? (
          <EmptyState
            icon={<PackageIcon className="h-6 w-6" />}
            title="No packages"
            description="Create training packages to publish on the website."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Package</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Billing</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">Sessions</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Valid</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.packages.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{p.name}</p>
                      {p.description && (
                        <p className="max-w-64 truncate text-xs text-muted">{p.description}</p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">
                      {billingTypeLabel[p.billingType]}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatMoney(p.price)}</td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">
                      {p.sessionsPerWeek > 0 ? `${p.sessionsPerWeek}/week` : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted lg:table-cell">
                      {p.startDate || p.endDate
                        ? `${p.startDate ? formatDate(p.startDate) : "—"} → ${p.endDate ? formatDate(p.endDate) : "—"}`
                        : "Open-ended"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.isActive ? "green" : "gray"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            startTransition(async () => {
                              const res = await togglePackageAction(p.id);
                              if (res.ok) {
                                toast(p.isActive ? "Package deactivated" : "Package activated", "success");
                                void fetchPage(data.page);
                              } else toast(res.error, "error");
                            });
                          }}
                          disabled={pending}
                          className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                          aria-label={p.isActive ? "Deactivate" : "Activate"}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
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
        title={editId ? "Edit Package" : "Add Package"}
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Name *</span>
            <input
              className="input"
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Junior Cricket Program"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Description</span>
            <textarea
              className="input min-h-20 resize-y"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What the package includes"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Price (Rs.) *</span>
              <input
                type="number"
                min={0}
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Billing type *</span>
              <select
                className="input"
                value={form.billingType}
                onChange={(e) => setForm({ ...form, billingType: e.target.value })}
              >
                {BILLING_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {billingTypeLabel[b]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Sessions / week</span>
              <input
                type="number"
                min={0}
                max={30}
                className="input"
                value={form.sessionsPerWeek}
                onChange={(e) => setForm({ ...form, sessionsPerWeek: Number(e.target.value) })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Active</span>
              <select
                className="input"
                value={form.isActive ? "true" : "false"}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Start date</span>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">End date</span>
              <input
                type="date"
                className="input"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Features (one per line)
            </span>
            <textarea
              className="input min-h-24 resize-y"
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder={"3 sessions per week\nMonthly skill assessment\nMatch exposure"}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={pending} disabled={!form.name.trim() || form.price < 0}>
              {editId ? "Save Changes" : "Add Package"}
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
            const res = await deletePackageAction(deleteTarget.id);
            if (res.ok) {
              toast("Package deleted", "success");
              void fetchPage(data?.page ?? 1);
            } else {
              toast(res.error, "error");
            }
            setDeleteTarget(null);
          });
        }}
        loading={pending}
        title="Delete package?"
        message={`This will permanently remove "${deleteTarget?.name}".`}
        confirmLabel="Delete"
      />
    </div>
  );
}