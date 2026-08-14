"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Target, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import {
  GOAL_STATUSES,
  GOAL_CATEGORIES,
  goalStatusLabel,
  goalCategoryLabel,
} from "@/lib/constants";
import {
  addGoalAction,
  updateGoalAction,
  updateGoalProgressAction,
  deleteGoalAction,
} from "@/app/actions/goals";
import { useToast } from "@/components/providers/toast-provider";

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  baseline: string | null;
  target: string | null;
  progress: number;
  status: string;
  deadline: string | null;
  createdAt: string;
  student: {
    id: string;
    studentId: string;
    fullName: string;
    photoUrl: string | null;
    batch: { name: string } | null;
  };
  coach: { id: string; fullName: string } | null;
  updates: { id: string; progress: number; note: string | null; createdAt: string }[];
};

type StudentOpt = {
  id: string;
  studentId: string;
  fullName: string;
  photoUrl: string | null;
  batch: { name: string } | null;
};

type FormState = {
  studentId: string;
  title: string;
  description: string;
  category: string;
  baseline: string;
  target: string;
  progress: number;
  status: string;
  deadline: string;
};

const defaultForm: FormState = {
  studentId: "",
  title: "",
  description: "",
  category: "BATTING",
  baseline: "",
  target: "",
  progress: 0,
  status: "NOT_STARTED",
  deadline: "",
};

const statusTone: Record<string, "gold" | "green" | "blue" | "red" | "gray"> = {
  NOT_STARTED: "gray",
  IN_PROGRESS: "blue",
  ACHIEVED: "green",
  CANCELLED: "red",
};

export function GoalsModule({
  goals,
  students,
}: {
  goals: GoalRow[];
  students: StudentOpt[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [studentFilter, setStudentFilter] = useState<string>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [progressTarget, setProgressTarget] = useState<GoalRow | null>(null);
  const [progressVal, setProgressVal] = useState(0);
  const [progressNote, setProgressNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GoalRow | null>(null);

  const applyResult = (res: { ok: boolean }) => {
    if (res.ok) {
      setShowForm(false);
      setProgressTarget(null);
      router.refresh();
    }
  };

  const filtered = goals.filter(
    (g) =>
      (statusFilter === "ALL" || g.status === statusFilter) &&
      (studentFilter === "ALL" || g.student.id === studentFilter)
  );

  const openAdd = () => {
    setEditId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (g: GoalRow) => {
    setEditId(g.id);
    setForm({
      studentId: g.student.id,
      title: g.title,
      description: g.description ?? "",
      category: g.category,
      baseline: g.baseline ?? "",
      target: g.target ?? "",
      progress: g.progress,
      status: g.status,
      deadline: g.deadline ? g.deadline.slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const submit = () => {
    startTransition(async () => {
      const res = editId
        ? await updateGoalAction(editId, form)
        : await addGoalAction(form);
      if (res.ok) {
        toast(editId ? "Goal updated" : "Goal created", "success");
        applyResult(res);
      } else {
        toast(res.error, "error");
      }
    });
  };

  const submitProgress = () => {
    if (!progressTarget) return;
    startTransition(async () => {
      const res = await updateGoalProgressAction({
        goalId: progressTarget.id,
        progress: progressVal,
        note: progressNote,
      });
      if (res.ok) {
        toast("Progress updated", "success");
        applyResult(res);
      } else {
        toast(res.error, "error");
      }
    });
  };

  const studentName = (id: string) =>
    students.find((s) => s.id === id)?.fullName ?? "Unknown";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="ALL">All statuses</option>
          {GOAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {goalStatusLabel[s]}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          aria-label="Filter by student"
        >
          <option value="ALL">All students</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.studentId})
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> New Goal
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="No development goals"
          description="Create a goal to help students track their improvement."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((g) => (
            <div key={g.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={g.student.photoUrl} name={g.student.fullName} size={36} />
                  <div>
                    <p className="font-semibold leading-tight">{g.title}</p>
                    <p className="text-xs text-muted">
                      {g.student.fullName} · {g.student.studentId}
                      {g.student.batch?.name ? ` · ${g.student.batch.name}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(g)}
                    className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                    aria-label="Edit goal"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(g)}
                    className="rounded-lg p-2 text-danger transition hover:bg-danger/10"
                    aria-label="Delete goal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                <Badge tone="blue">{goalCategoryLabel[g.category] ?? g.category}</Badge>
                <Badge tone={statusTone[g.status] ?? "gray"}>{goalStatusLabel[g.status]}</Badge>
                {g.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(g.deadline)}
                  </span>
                )}
                {g.coach && <span className="text-muted">Coach: {g.coach.fullName}</span>}
              </div>

              {(g.baseline || g.target) && (
                <p className="mt-3 text-sm text-muted">
                  {g.baseline && <span>From {g.baseline}</span>}
                  {g.baseline && g.target && <span> → </span>}
                  {g.target && <span className="font-semibold text-foreground">{g.target}</span>}
                </p>
              )}
              {g.description && <p className="mt-2 text-sm text-muted">{g.description}</p>}

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wide text-muted">
                    Progress
                  </span>
                  <span className="font-bold">{g.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className={
                      g.status === "ACHIEVED"
                        ? "h-full rounded-full bg-success transition-all"
                        : "h-full rounded-full bg-gold transition-all"
                    }
                    style={{ width: `${Math.min(100, Math.max(0, g.progress))}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-muted">
                    {g.status === "ACHIEVED" ? (
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="h-3 w-3" /> Achieved
                      </span>
                    ) : g.status === "CANCELLED" ? (
                      <span className="flex items-center gap-1 text-danger">
                        <XCircle className="h-3 w-3" /> Cancelled
                      </span>
                    ) : (
                      `Last update ${g.updates.length > 0 ? formatDate(g.updates[0].createdAt) : "—"}`
                    )}
                  </span>
                  <button
                    onClick={() => {
                      setProgressTarget(g);
                      setProgressVal(g.progress);
                      setProgressNote("");
                    }}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-gold transition hover:bg-gold/10"
                  >
                    Update Progress
                  </button>
                </div>
              </div>

              {g.updates.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {g.updates.slice(0, 3).map((u) => (
                    <div key={u.id} className="flex items-start gap-2 text-xs">
                      <span className="mt-0.5 shrink-0 rounded bg-surface-alt px-1.5 py-0.5 font-bold">
                        {u.progress}%
                      </span>
                      <span className="text-muted">
                        {u.note || "Progress updated"}
                        <span className="ml-1 text-[10px] opacity-70">
                          {formatDate(u.createdAt)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? "Edit Goal" : "New Development Goal"}
        size="lg"
      >
        <div className="space-y-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Student *
            </span>
            <select
              className="input"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Goal *
            </span>
            <input
              type="text"
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Improve batting strike rotation"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Category
              </span>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {GOAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {goalCategoryLabel[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Deadline
              </span>
              <input
                type="date"
                className="input"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Baseline
              </span>
              <input
                type="text"
                className="input"
                value={form.baseline}
                onChange={(e) => setForm({ ...form, baseline: e.target.value })}
                placeholder="e.g. 5/10 strike rotation"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Target
              </span>
              <input
                type="text"
                className="input"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                placeholder="e.g. 8/10 strike rotation"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Description
            </span>
            <textarea
              className="input min-h-20"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional details about the goal"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Status
              </span>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {GOAL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {goalStatusLabel[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Starting progress (%)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                className="input"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              loading={pending}
              disabled={!form.studentId || !form.title.trim()}
            >
              {editId ? "Save Changes" : "Create Goal"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!progressTarget}
        onClose={() => setProgressTarget(null)}
        title={`Update Progress — ${progressTarget?.title ?? ""}`}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Goal for {progressTarget ? studentName(progressTarget.student.id) : ""}
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Progress — {progressVal}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              className="w-full accent-gold"
              value={progressVal}
              onChange={(e) => setProgressVal(Number(e.target.value))}
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>Not Started</span>
              <span>Achieved</span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Coach note
            </span>
            <textarea
              className="input min-h-20"
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              placeholder="Optional note about this update"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setProgressTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitProgress} loading={pending}>
              Save Update
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
            const res = await deleteGoalAction(deleteTarget.id);
            if (res.ok) {
              toast("Goal deleted", "success");
              applyResult(res);
            } else {
              toast(res.error, "error");
            }
            setDeleteTarget(null);
          });
        }}
        loading={pending}
        title="Delete goal?"
        message={`This will permanently remove "${deleteTarget?.title}" and its progress history.`}
        confirmLabel="Delete"
      />
    </div>
  );
}