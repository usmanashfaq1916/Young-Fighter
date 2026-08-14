"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Dumbbell,
  ClipboardCheck,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { TRAINING_CATEGORIES, trainingCategoryLabel } from "@/lib/constants";
import {
  createTrainingSessionAction,
  updateTrainingSessionAction,
  deleteTrainingSessionAction,
  saveTrainingAttendanceAction,
} from "@/app/actions/training";
import { useToast } from "@/components/providers/toast-provider";

type SessionRow = {
  id: string;
  date: string;
  topic: string;
  category: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  notes: string | null;
  batch: { id: string; name: string } | null;
  coach: { id: string; fullName: string } | null;
  records: { id: string; studentId: string; present: boolean; notes: string | null; highlights: string | null }[];
};

type BatchOpt = { id: string; name: string };
type CoachOpt = { id: string; fullName: string };
type StudentOpt = {
  id: string;
  studentId: string;
  fullName: string;
  photoUrl: string | null;
  batchId: string | null;
};

type FormState = {
  date: string;
  batchId: string;
  coachId: string;
  topic: string;
  category: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
};

const defaultForm: FormState = {
  date: new Date().toISOString().slice(0, 10),
  batchId: "",
  coachId: "",
  topic: "",
  category: "BATTING",
  startTime: "",
  endTime: "",
  location: "",
  notes: "",
};

const categoryTone: Record<string, "gold" | "green" | "blue" | "red" | "gray"> = {
  BATTING: "gold",
  BOWLING: "blue",
  FIELDING: "green",
  FITNESS: "red",
  WICKETKEEPING: "gray",
  TACTICAL: "gray",
  MATCH_PRACTICE: "gold",
};

export function TrainingModule({
  sessions,
  batches,
  coaches,
  students,
  today,
}: {
  sessions: SessionRow[];
  batches: BatchOpt[];
  coaches: CoachOpt[];
  students: StudentOpt[];
  today: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [period, setPeriod] = useState<"upcoming" | "past" | "all">("upcoming");
  const [batchFilter, setBatchFilter] = useState<string>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [recordTarget, setRecordTarget] = useState<SessionRow | null>(null);
  const [attendance, setAttendance] = useState<
    Record<string, { present: boolean; notes: string }>
  >({});
  const [deleteTarget, setDeleteTarget] = useState<SessionRow | null>(null);

  const filtered = sessions.filter((s) => {
    if (period === "upcoming" && s.date < today) return false;
    if (period === "past" && s.date >= today) return false;
    if (batchFilter !== "ALL" && s.batch?.id !== batchFilter) return false;
    return true;
  });

  const sessionStudents = (s: SessionRow) =>
    students.filter((st) => st.batchId === s.batch?.id);

  const openAdd = () => {
    setEditId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (s: SessionRow) => {
    setEditId(s.id);
    setForm({
      date: s.date.slice(0, 10),
      batchId: s.batch?.id ?? "",
      coachId: s.coach?.id ?? "",
      topic: s.topic,
      category: s.category,
      startTime: s.startTime ?? "",
      endTime: s.endTime ?? "",
      location: s.location ?? "",
      notes: s.notes ?? "",
    });
    setShowForm(true);
  };

  const openRecord = (s: SessionRow) => {
    setRecordTarget(s);
    const initial: Record<string, { present: boolean; notes: string }> = {};
    const existing = new Map(s.records.map((r) => [r.studentId, r]));
    for (const st of sessionStudents(s)) {
      const rec = existing.get(st.id);
      initial[st.id] = {
        present: rec ? rec.present : true,
        notes: rec?.notes ?? "",
      };
    }
    setAttendance(initial);
  };

  const submit = () => {
    startTransition(async () => {
      const res = editId
        ? await updateTrainingSessionAction(editId, form)
        : await createTrainingSessionAction(form);
      if (res.ok) {
        toast(editId ? "Session updated" : "Session scheduled", "success");
        setShowForm(false);
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  };

  const submitAttendance = () => {
    if (!recordTarget) return;
    const entries = Object.entries(attendance).map(([studentId, v]) => ({
      studentId,
      present: v.present,
      notes: v.notes,
    }));
    startTransition(async () => {
      const res = await saveTrainingAttendanceAction({
        sessionId: recordTarget.id,
        entries,
      });
      if (res.ok) {
        toast("Attendance saved", "success");
        setRecordTarget(null);
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  };

  const toggleAll = (present: boolean) => {
    setAttendance((a) => {
      const next: Record<string, { present: boolean; notes: string }> = {};
      for (const [id, v] of Object.entries(a)) next[id] = { ...v, present };
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input w-auto"
          value={period}
          onChange={(e) => setPeriod(e.target.value as typeof period)}
          aria-label="Filter by period"
        >
          <option value="upcoming">Upcoming sessions</option>
          <option value="past">Completed sessions</option>
          <option value="all">All sessions</option>
        </select>
        <select
          className="input w-auto"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          aria-label="Filter by batch"
        >
          <option value="ALL">All batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> New Session
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="h-6 w-6" />}
          title="No training sessions"
          description="Schedule a session to plan batting, bowling, fielding or fitness drills."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((s) => {
            const present = s.records.filter((r) => r.present).length;
            return (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{s.topic}</p>
                      <p className="text-xs text-muted">
                        {formatDate(s.date)}
                        {s.startTime && ` · ${s.startTime}`}
                        {s.endTime && `–${s.endTime}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                      aria-label="Edit session"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      className="rounded-lg p-2 text-danger transition hover:bg-danger/10"
                      aria-label="Delete session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Badge tone={categoryTone[s.category] ?? "gray"}>
                    {trainingCategoryLabel[s.category] ?? s.category}
                  </Badge>
                  {s.batch && <Badge tone="blue">{s.batch.name}</Badge>}
                  {s.coach && (
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3 w-3" /> {s.coach.fullName}
                    </span>
                  )}
                  {s.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {s.location}
                    </span>
                  )}
                </div>

                {s.notes && <p className="mt-2 text-sm text-muted">{s.notes}</p>}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted">
                    {s.records.length > 0 ? (
                      <>
                        Attendance{" "}
                        <span className="font-bold text-foreground">
                          {present}/{s.records.length}
                        </span>{" "}
                        present
                      </>
                    ) : (
                      "No attendance recorded yet"
                    )}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openRecord(s)}
                    disabled={!s.batch}
                  >
                    <ClipboardCheck className="h-4 w-4" /> Record Attendance
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? "Edit Session" : "New Training Session"}
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Session date *
              </span>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Category *
              </span>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {TRAINING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {trainingCategoryLabel[c]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Topic *
            </span>
            <input
              type="text"
              className="input"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="e.g. Cover drives and off-side timing"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Batch
              </span>
              <select
                className="input"
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
              >
                <option value="">No batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Coach
              </span>
              <select
                className="input"
                value={form.coachId}
                onChange={(e) => setForm({ ...form, coachId: e.target.value })}
              >
                <option value="">Not assigned</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Start time
              </span>
              <input
                type="time"
                className="input"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                End time
              </span>
              <input
                type="time"
                className="input"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Location
              </span>
              <input
                type="text"
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Ground A"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Notes
            </span>
            <textarea
              className="input min-h-20"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional session plan or notes"
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={pending} disabled={!form.topic.trim()}>
              {editId ? "Save Changes" : "Schedule Session"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!recordTarget}
        onClose={() => setRecordTarget(null)}
        title={`Attendance — ${recordTarget?.topic ?? ""}`}
        size="lg"
      >
        {recordTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-surface-alt px-4 py-2 text-xs text-muted">
              <span>
                <CalendarDays className="mr-1 inline h-3 w-3" />
                {formatDate(recordTarget.date)}
                {recordTarget.batch && ` · ${recordTarget.batch.name}`}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => toggleAll(true)}>
                  Mark all present
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggleAll(false)}>
                  Mark all absent
                </Button>
              </div>
            </div>

            {sessionStudents(recordTarget).length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck className="h-6 w-6" />}
                title="No students in this batch"
                description="Assign students to the batch first, then record attendance."
              />
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {sessionStudents(recordTarget).map((st) => {
                  const entry = attendance[st.id];
                  if (!entry) return null;
                  return (
                    <div
                      key={st.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <Avatar src={st.photoUrl} name={st.fullName} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{st.fullName}</p>
                        <p className="text-xs text-muted">{st.studentId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-gold"
                            checked={entry.present}
                            onChange={(e) =>
                              setAttendance((a) => ({
                                ...a,
                                [st.id]: { ...entry, present: e.target.checked },
                              }))
                            }
                          />
                          Present
                        </label>
                        <input
                          type="text"
                          className="input h-8 w-40 px-2 text-xs"
                          placeholder="Notes / highlights"
                          value={entry.notes}
                          onChange={(e) =>
                            setAttendance((a) => ({
                              ...a,
                              [st.id]: { ...entry, notes: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRecordTarget(null)}>
                Cancel
              </Button>
              <Button onClick={submitAttendance} loading={pending}>
                Save Attendance
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          startTransition(async () => {
            const res = await deleteTrainingSessionAction(deleteTarget.id);
            if (res.ok) {
              toast("Session deleted", "success");
              setDeleteTarget(null);
              router.refresh();
            } else {
              toast(res.error, "error");
            }
          });
        }}
        loading={pending}
        title="Delete session?"
        message={`This will permanently remove the "${deleteTarget?.topic}" session and its attendance records.`}
        confirmLabel="Delete"
      />
    </div>
  );
}