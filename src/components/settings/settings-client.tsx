"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createBatchAction,
  updateBatchAction,
  deleteBatchAction,
  updateSettingsAction,
} from "@/app/actions/misc";
import { useToast } from "@/components/providers/toast-provider";

type Batch = {
  id: string;
  name: string;
  description: string | null;
  coachId: string | null;
  coach: { fullName: string } | null;
  _count: { students: number };
};

const SETTING_FIELDS = [
  { key: "academyName", label: "Academy name" },
  { key: "academyPhone", label: "Contact phone" },
  { key: "academyEmail", label: "Contact email" },
  { key: "academyAddress", label: "Address" },
  { key: "receiptFooter", label: "Receipt footer" },
];

export function SettingsClient({
  user,
  batches,
  coaches,
  initial,
}: {
  user: { role: string };
  batches: Batch[];
  coaches: { id: string; fullName: string }[];
  initial: Record<string, string>;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(batches);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [dirty, setDirty] = useState(false);
  const [batchModal, setBatchModal] = useState<null | { id?: string; name: string; description: string; coachId: string }>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const saveSettings = () => {
    startTransition(async () => {
      await updateSettingsAction(values);
      setDirty(false);
      toast("Settings saved", "success");
    });
  };

  const saveBatch = () => {
    if (!batchModal || !batchModal.name.trim()) return;
    startTransition(async () => {
      const res = batchModal.id
        ? await updateBatchAction(batchModal.id, {
            name: batchModal.name,
            description: batchModal.description,
            coachId: batchModal.coachId || undefined,
          })
        : await createBatchAction({
            name: batchModal.name,
            description: batchModal.description,
            coachId: batchModal.coachId || undefined,
          });
      if (res.ok) {
        toast(batchModal.id ? "Batch updated" : "Batch created", "success");
        setBatchModal(null);
        window.location.reload();
      } else {
        toast(res.error, "error");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const res = await deleteBatchAction(deleteId);
      if (res.ok) {
        toast("Batch deleted", "success");
        setItems((prev) => prev.filter((b) => b.id !== deleteId));
      } else {
        toast(res.error, "error");
      }
      setDeleteId(null);
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
          Academy information
        </h3>
        <div className="space-y-4">
          {SETTING_FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {f.label}
              </span>
              <input
                className="input"
                value={values[f.key] ?? ""}
                onChange={(e) => {
                  setValues({ ...values, [f.key]: e.target.value });
                  setDirty(true);
                }}
              />
            </label>
          ))}
          <div className="flex justify-end">
            <Button onClick={saveSettings} loading={pending} disabled={!dirty}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Batches</h3>
          {user.role === "ADMIN" && (
            <Button size="sm" onClick={() => setBatchModal({ name: "", description: "", coachId: "" })}>
              <Plus className="h-4 w-4" /> New batch
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted">No batches yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {b.name}
                    <Badge tone="gray">{b._count.students} students</Badge>
                  </p>
                  <p className="truncate text-xs text-muted">
                    {b.description || "No description"}
                    {b.coach?.fullName ? ` · Coach: ${b.coach.fullName}` : ""}
                  </p>
                </div>
                {user.role === "ADMIN" && (
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setBatchModal({ id: b.id, name: b.name, description: b.description ?? "", coachId: b.coachId ?? "" })
                      }
                      className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(b.id)}
                      className="rounded-lg p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={!!batchModal}
        onClose={() => setBatchModal(null)}
        title={batchModal?.id ? "Edit batch" : "New batch"}
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Name *</span>
            <input
              className="input"
              value={batchModal?.name ?? ""}
              onChange={(e) => setBatchModal((m) => (m ? { ...m, name: e.target.value } : m))}
              placeholder="e.g. Morning Batch A"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Description</span>
            <input
              className="input"
              value={batchModal?.description ?? ""}
              onChange={(e) => setBatchModal((m) => (m ? { ...m, description: e.target.value } : m))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Coach</span>
            <select
              className="input"
              value={batchModal?.coachId ?? ""}
              onChange={(e) => setBatchModal((m) => (m ? { ...m, coachId: e.target.value } : m))}
            >
              <option value="">Unassigned</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBatchModal(null)}>
              Cancel
            </Button>
            <Button onClick={saveBatch} loading={pending} disabled={!batchModal?.name.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete batch?"
        message="This batch will be removed permanently. Batches with students can't be deleted."
        confirmLabel="Delete"
        danger
        loading={pending}
      />
    </div>
  );
}