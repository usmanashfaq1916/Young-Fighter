"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/utils";
import {
  addPerformanceAction,
  updatePerformanceAction,
  deletePerformanceAction,
} from "@/app/actions/performance";
import { useToast } from "@/components/providers/toast-provider";

type PerfRow = {
  id: string;
  date: string;
  battingRating: number;
  bowlingRating: number;
  fieldingRating: number;
  fitnessRating: number;
  disciplineRating: number;
  overallRating: number;
  subSkills: Record<string, Record<string, number>> | null;
  remarks: string | null;
  previousRating: number | null;
  student: {
    id: string;
    studentId: string;
    fullName: string;
    photoUrl: string | null;
    batch: { name: string } | null;
  };
};

type FormState = {
  studentId: string;
  date: string;
  battingRating: number;
  bowlingRating: number;
  fieldingRating: number;
  fitnessRating: number;
  disciplineRating: number;
  subSkills: Record<string, Record<string, number>>;
  remarks: string;
};

const defaultForm: FormState = {
  studentId: "",
  date: new Date().toISOString().slice(0, 10),
  battingRating: 5,
  bowlingRating: 5,
  fieldingRating: 5,
  fitnessRating: 5,
  disciplineRating: 5,
  subSkills: {},
  remarks: "",
};

const SUB_SKILL_KEYS: { key: string; label: string }[] = [
  { key: "batting", label: "Batting" },
  { key: "bowling", label: "Bowling" },
  { key: "fielding", label: "Fielding" },
  { key: "fitness", label: "Fitness" },
  { key: "discipline", label: "Discipline" },
];

const subSkillAverage = (s: Record<string, Record<string, number>> | null): number | null => {
  if (!s) return null;
  const vals: number[] = [];
  for (const group of Object.values(s)) {
    for (const v of Object.values(group)) vals.push(v);
  }
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
};

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="rounded p-1 transition hover:scale-110"
            aria-label={`${label} ${n}`}
          >
            <Star
              className={n <= value ? "h-4 w-4 fill-gold text-gold" : "h-4 w-4 text-border"}
            />
          </button>
        ))}
        <span className="ml-1 w-6 text-sm font-bold">{value}</span>
      </div>
    </label>
  );
}

export function PerformanceModule() {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const [data, setData] = useState<{
    records: PerfRow[];
    total: number;
    page: number;
    pageSize: number;
    pages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [searchResults, setSearchResults] = useState<
    { id: string; fullName: string; studentId: string }[]
  >([]);
  const [deleteTarget, setDeleteTarget] = useState<PerfRow | null>(null);

  const fetchPage = useCallback(
    async (page: number) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (debouncedQ) params.set("q", debouncedQ);
      try {
        const res = await fetch(`/api/performance?${params}`, { cache: "no-store" });
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ]
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
    const res = await fetch(`/api/students?q=${encodeURIComponent(query)}&pageSize=8`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      setSearchResults(json.students);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm(defaultForm);
    setSearchResults([]);
    setQ("");
    setShowForm(true);
  };

  const openEdit = (r: PerfRow) => {
    setEditId(r.id);
    setForm({
      studentId: r.student.id,
      date: r.date.slice(0, 10),
      battingRating: r.battingRating,
      bowlingRating: r.bowlingRating,
      fieldingRating: r.fieldingRating,
      fitnessRating: r.fitnessRating,
      disciplineRating: r.disciplineRating,
      subSkills: r.subSkills ?? {},
      remarks: r.remarks ?? "",
    });
    setShowForm(true);
  };

  const submit = () => {
    startTransition(async () => {
      const cleanSub: Record<string, Record<string, number>> = {};
      for (const [key, group] of Object.entries(form.subSkills)) {
        const clean: Record<string, number> = {};
        for (const [k, v] of Object.entries(group)) {
          if (v > 0) clean[k] = v;
        }
        if (Object.keys(clean).length > 0) cleanSub[key] = clean;
      }
      const payload = { ...form, subSkills: Object.keys(cleanSub).length > 0 ? cleanSub : null };
      const res = editId
        ? await updatePerformanceAction(editId, payload)
        : await addPerformanceAction(payload);
      if (res.ok) {
        toast(editId ? "Performance updated" : "Performance recorded", "success");
        setShowForm(false);
        void fetchPage(data?.page ?? 1);
      } else {
        toast(res.error, "error");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search student…"
          className="w-full sm:w-72"
        />
        <div className="ml-auto">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Assessment
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : !data || data.records.length === 0 ? (
          <EmptyState
            icon={<Star className="h-6 w-6" />}
            title="No performance records"
            description="Add the first student assessment to track progress."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Bat</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Bowl</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Field</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Fitness</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Disc</th>
                  <th className="px-4 py-3 font-semibold">Overall</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.records.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={r.student.photoUrl} name={r.student.fullName} size={32} />
                        <div>
                          <p className="font-semibold">{r.student.fullName}</p>
                          <p className="text-xs text-muted">
                            {r.student.studentId}
                            {r.student.batch?.name ? ` · ${r.student.batch.name}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(r.date)}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{r.battingRating}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{r.bowlingRating}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{r.fieldingRating}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">{r.fitnessRating}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">{r.disciplineRating}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone={r.overallRating >= 7 ? "green" : r.overallRating >= 4 ? "gold" : "red"}>
                          {r.overallRating}/10
                        </Badge>
                        {r.previousRating != null && (
                          <span
                            className={
                              r.overallRating > r.previousRating
                                ? "text-xs font-bold text-success"
                                : r.overallRating < r.previousRating
                                  ? "text-xs font-bold text-danger"
                                  : "text-xs text-muted"
                            }
                          >
                            {r.overallRating > r.previousRating
                              ? `▲${(r.overallRating - r.previousRating).toFixed(1)}`
                              : r.overallRating < r.previousRating
                                ? `▼${(r.previousRating - r.overallRating).toFixed(1)}`
                                : "—"}
                          </span>
                        )}
                        {subSkillAverage(r.subSkills) != null && (
                          <Badge tone="blue">Sub {subSkillAverage(r.subSkills)}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(r)}
                          className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
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
        title={editId ? "Edit Assessment" : "New Assessment"}
        size="lg"
      >
        <div className="space-y-5">
          {!editId && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Student *
              </span>
              {!form.studentId ? (
                <>
                  <SearchBar
                    value={q}
                    onChange={(v) => {
                      setQ(v);
                      void searchStudents(v);
                    }}
                    placeholder="Search student…"
                  />
                  {searchResults.length > 0 && (
                    <ul className="max-h-44 overflow-auto rounded-xl border border-border bg-surface-alt">
                      {searchResults.map((s) => (
                        <li key={s.id}>
                          <button
                            onClick={() => {
                              setForm((f) => ({ ...f, studentId: s.id }));
                              setSearchResults([]);
                              setQ("");
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-border"
                          >
                            {s.fullName}{" "}
                            <span className="text-xs text-muted">{s.studentId}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface-alt px-3 py-2 text-sm">
                  <span className="font-semibold">
                    {data?.records.find((r) => r.student.id === form.studentId)?.student
                      .fullName ?? "Student selected"}
                  </span>
                  <button
                    onClick={() => setForm((f) => ({ ...f, studentId: "" }))}
                    className="text-xs text-danger"
                  >
                    Change
                  </button>
                </div>
              )}
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Assessment Date *
            </span>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <RatingInput
              label="Batting"
              value={form.battingRating}
              onChange={(v) => setForm({ ...form, battingRating: v })}
            />
            <RatingInput
              label="Bowling"
              value={form.bowlingRating}
              onChange={(v) => setForm({ ...form, bowlingRating: v })}
            />
            <RatingInput
              label="Fielding"
              value={form.fieldingRating}
              onChange={(v) => setForm({ ...form, fieldingRating: v })}
            />
            <RatingInput
              label="Fitness"
              value={form.fitnessRating}
              onChange={(v) => setForm({ ...form, fitnessRating: v })}
            />
            <RatingInput
              label="Discipline"
              value={form.disciplineRating}
              onChange={(v) => setForm({ ...form, disciplineRating: v })}
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Coach Notes
            </span>
            <textarea
              className="input min-h-20"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Optional comments for the student"
            />
          </label>

          <details className="rounded-xl border border-border">
            <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted">
              Sub-skills (optional)
            </summary>
            <div className="space-y-4 px-4 pb-4">
              <p className="text-xs text-muted">
                Refine each rating with technique and consistency scores (1–10). Leave blank to skip.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {SUB_SKILL_KEYS.map((g) => (
                  <div key={g.key} className="rounded-xl bg-surface-alt p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                      {g.label}
                    </p>
                    <div className="flex gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-muted">Technique</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className="input h-8 w-16 px-2 text-sm"
                          value={form.subSkills[g.key]?.technique ?? ""}
                          placeholder="—"
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              subSkills: {
                                ...f.subSkills,
                                [g.key]: {
                                  ...f.subSkills[g.key],
                                  technique: e.target.value ? Number(e.target.value) : 0,
                                },
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-muted">Consistency</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className="input h-8 w-16 px-2 text-sm"
                          value={form.subSkills[g.key]?.consistency ?? ""}
                          placeholder="—"
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              subSkills: {
                                ...f.subSkills,
                                [g.key]: {
                                  ...f.subSkills[g.key],
                                  consistency: e.target.value ? Number(e.target.value) : 0,
                                },
                              },
                            }))
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={pending} disabled={!form.studentId && !editId}>
              {editId ? "Save Changes" : "Save Assessment"}
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
            const res = await deletePerformanceAction(deleteTarget.id);
            if (res.ok) {
              toast("Assessment deleted", "success");
              void fetchPage(data?.page ?? 1);
            } else {
              toast(res.error, "error");
            }
            setDeleteTarget(null);
          });
        }}
        loading={pending}
        title="Delete assessment?"
        message={`This will permanently remove ${deleteTarget?.student.fullName}'s assessment from ${deleteTarget ? formatDate(deleteTarget.date) : ""}.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
