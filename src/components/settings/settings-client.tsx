"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Save, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createBatchAction,
  updateBatchAction,
  deleteBatchAction,
  updateSettingsAction,
  removeStudentFromBatchAction,
} from "@/app/actions/misc";
import { useToast } from "@/components/providers/toast-provider";

type Batch = {
  id: string;
  name: string;
  description: string | null;
  coachId: string | null;
  coach: { fullName: string } | null;
  ageGroup: string | null;
  trainingDays: string | null;
  trainingTime: string | null;
  trainingLocation: string | null;
  capacity: number;
  isActive: boolean;
  _count: { students: number };
  students: { id: string; fullName: string; studentId: string; status: string }[];
};

const SETTING_FIELDS = [
  { key: "academyName", label: "Academy name" },
  { key: "academyPhone", label: "Contact phone" },
  { key: "academyEmail", label: "Contact email" },
  { key: "academyAddress", label: "Address" },
  { key: "academyHours", label: "Office hours (e.g. Mon–Sat, 9:00am – 8:00pm)" },
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
  const [batchModal, setBatchModal] = useState<null | {
    id?: string;
    name: string;
    description: string;
    coachId: string;
    ageGroup: string;
    trainingDays: string;
    trainingTime: string;
    trainingLocation: string;
    capacity: number | string;
    isActive: boolean;
  }>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ batchId: string; studentId: string; name: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const confirmRemove = () => {
    if (!removeTarget) return;
    startTransition(async () => {
      const res = await removeStudentFromBatchAction(removeTarget.studentId, removeTarget.batchId);
      if (res.ok) {
        toast("Student removed from batch", "success");
        setItems((prev) =>
          prev.map((b) =>
            b.id === removeTarget.batchId
              ? { ...b, students: b.students.filter((s) => s.id !== removeTarget.studentId) }
              : b
          )
        );
      } else {
        toast(res.error, "error");
      }
      setRemoveTarget(null);
    });
  };

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
            ageGroup: batchModal.ageGroup,
            trainingDays: batchModal.trainingDays,
            trainingTime: batchModal.trainingTime,
            trainingLocation: batchModal.trainingLocation,
            capacity: Number(batchModal.capacity) || 0,
            isActive: batchModal.isActive,
          })
        : await createBatchAction({
            name: batchModal.name,
            description: batchModal.description,
            coachId: batchModal.coachId || undefined,
            ageGroup: batchModal.ageGroup,
            trainingDays: batchModal.trainingDays,
            trainingTime: batchModal.trainingTime,
            trainingLocation: batchModal.trainingLocation,
            capacity: Number(batchModal.capacity) || 0,
            isActive: batchModal.isActive,
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
            <Button
              size="sm"
              onClick={() =>
                setBatchModal({
                  name: "",
                  description: "",
                  coachId: "",
                  ageGroup: "",
                  trainingDays: "",
                  trainingTime: "",
                  trainingLocation: "",
                  capacity: "",
                  isActive: true,
                })
              }
            >
              <Plus className="h-4 w-4" /> New batch
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted">No batches yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((b) => (
              <li key={b.id} className="border-b border-border py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      {b.name}
                      {!b.isActive && <Badge tone="red">Inactive</Badge>}
                      <Badge tone="gray">
                        {b._count.students}/{b.capacity || "∞"} students
                      </Badge>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {b.description || "No description"}
                      {b.coach?.fullName ? ` · Coach: ${b.coach.fullName}` : ""}
                      {b.ageGroup ? ` · Age: ${b.ageGroup}` : ""}
                    </p>
                    {(b.trainingDays || b.trainingTime || b.trainingLocation) && (
                      <p className="truncate text-xs text-muted">
                        Training:{" "}
                        {[b.trainingDays, b.trainingTime, b.trainingLocation]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface-alt hover:text-foreground"
                  >
                    <Users className="h-4 w-4" />
                    Members ({b.students.length})
                  </button>
                  {user.role === "ADMIN" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          setBatchModal({
                            id: b.id,
                            name: b.name,
                            description: b.description ?? "",
                            coachId: b.coachId ?? "",
                            ageGroup: b.ageGroup ?? "",
                            trainingDays: b.trainingDays ?? "",
                            trainingTime: b.trainingTime ?? "",
                            trainingLocation: b.trainingLocation ?? "",
                            capacity: b.capacity ?? 0,
                            isActive: b.isActive,
                          })
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
                </div>
                {expanded === b.id && (
                  <div className="mt-2 rounded-xl border border-border bg-surface-alt/40 p-3">
                    {b.students.length === 0 ? (
                      <p className="text-xs text-muted">No students in this batch yet.</p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {b.students.map((s) => (
                          <li key={s.id} className="flex items-center gap-2 py-1.5">
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {s.fullName}{" "}
                              <span className="text-xs text-muted">({s.studentId})</span>
                            </span>
                            {s.status !== "ACTIVE" && <Badge tone="red">Inactive</Badge>}
                            {user.role === "ADMIN" && (
                              <button
                                onClick={() =>
                                  setRemoveTarget({ batchId: b.id, studentId: s.id, name: s.fullName })
                                }
                                className="rounded-lg p-1 text-muted transition hover:bg-danger/10 hover:text-danger"
                                title="Remove from batch"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
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
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Age group</span>
              <input
                className="input"
                value={batchModal?.ageGroup ?? ""}
                onChange={(e) => setBatchModal((m) => (m ? { ...m, ageGroup: e.target.value } : m))}
                placeholder="e.g. 10–14 yrs"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Capacity</span>
              <input
                type="number"
                min={0}
                className="input"
                value={batchModal?.capacity ?? ""}
                onChange={(e) => setBatchModal((m) => (m ? { ...m, capacity: e.target.value } : m))}
                placeholder="0 = unlimited"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Training days</span>
            <input
              className="input"
              value={batchModal?.trainingDays ?? ""}
              onChange={(e) => setBatchModal((m) => (m ? { ...m, trainingDays: e.target.value } : m))}
              placeholder="e.g. Mon, Wed, Fri"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Training time</span>
              <input
                className="input"
                value={batchModal?.trainingTime ?? ""}
                onChange={(e) => setBatchModal((m) => (m ? { ...m, trainingTime: e.target.value } : m))}
                placeholder="e.g. 4:00–6:00 PM"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Location</span>
              <input
                className="input"
                value={batchModal?.trainingLocation ?? ""}
                onChange={(e) => setBatchModal((m) => (m ? { ...m, trainingLocation: e.target.value } : m))}
                placeholder="e.g. Main Ground"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={batchModal?.isActive ?? true}
              onChange={(e) => setBatchModal((m) => (m ? { ...m, isActive: e.target.checked } : m))}
              className="h-4 w-4"
            />
            <span className="font-medium">Active batch</span>
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

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title="Remove student from batch?"
        message={`${removeTarget?.name} will be removed from this batch. You can reassign them later from their profile.`}
        confirmLabel="Remove"
        danger
        loading={pending}
      />
    </div>
  );
}