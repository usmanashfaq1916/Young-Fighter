"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { SearchBar } from "@/components/ui/search-bar";
import { formatDate } from "@/lib/utils";
import { matchResultLabel, MATCH_RESULTS } from "@/lib/constants";
import { saveMatchAction } from "@/app/actions/performance";
import { useToast } from "@/components/providers/toast-provider";

type MatchRecord = {
  id: string;
  runs: number;
  ballsFaced: number | null;
  wickets: number;
  catches: number;
  strikeRate: number | null;
  economy: number | null;
  manOfTheMatch: boolean;
  student: { id: string; fullName: string; studentId: string; photoUrl: string | null };
};

type MatchRow = {
  id: string;
  matchDate: string;
  opponent: string;
  venue: string | null;
  result: string | null;
  records: MatchRecord[];
};

type StudentOption = {
  id: string;
  fullName: string;
  studentId: string;
  photoUrl: string | null;
};

type RowForm = {
  studentId: string;
  runs: number;
  ballsFaced: number | null;
  wickets: number;
  catches: number;
  manOfTheMatch: boolean;
};

export function MatchesModule() {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const [data, setData] = useState<{ matches: MatchRow[]; students: StudentOption[]; upcoming: MatchRow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    matchDate: new Date().toISOString().slice(0, 10),
    opponent: "",
    venue: "",
    result: "",
  });
  const [rows, setRows] = useState<RowForm[]>([]);
  const [searchResults, setSearchResults] = useState<StudentOption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/matches?${params}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

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
    setForm({
      matchDate: new Date().toISOString().slice(0, 10),
      opponent: "",
      venue: "",
      result: "",
    });
    setRows([]);
    setSearchResults([]);
    setQ("");
    setShowForm(true);
  };

  const openEdit = (m: MatchRow) => {
    setEditId(m.id);
    setForm({
      matchDate: m.matchDate.slice(0, 10),
      opponent: m.opponent,
      venue: m.venue ?? "",
      result: m.result ?? "",
    });
    setRows(
      m.records.map((r) => ({
        studentId: r.student.id,
        runs: r.runs,
        ballsFaced: r.ballsFaced,
        wickets: r.wickets,
        catches: r.catches,
        manOfTheMatch: r.manOfTheMatch,
      }))
    );
    setShowForm(true);
  };

  const addRow = (s: StudentOption) => {
    if (rows.some((r) => r.studentId === s.id)) return;
    setRows((prev) => [...prev, { studentId: s.id, runs: 0, ballsFaced: null, wickets: 0, catches: 0, manOfTheMatch: false }]);
    setSearchResults([]);
    setQ("");
  };

  const updateRow = (index: number, patch: Partial<RowForm>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const submit = () => {
    startTransition(async () => {
      const res = await saveMatchAction({
        id: editId ?? undefined,
        matchDate: form.matchDate,
        opponent: form.opponent,
        venue: form.venue,
        result: form.result || null,
        records: rows,
      });
      if (res.ok) {
        toast(editId ? "Match updated" : "Match recorded", "success");
        setShowForm(false);
        void load();
      } else {
        toast(res.error, "error");
      }
    });
  };

  const motmCount = (m: MatchRow) => m.records.filter((r) => r.manOfTheMatch).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search opponent or student…"
          className="w-full sm:w-72"
        />
        <div className="ml-auto">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> New Match
          </Button>
        </div>
      </div>

      {/* Upcoming */}
      {data && data.upcoming.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
            <Trophy className="h-4 w-4 text-gold" /> Upcoming Fixtures
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.upcoming.map((m) => (
              <div key={m.id} className="rounded-xl bg-surface-alt px-3 py-2 text-sm">
                <span className="font-semibold">vs {m.opponent}</span>
                <span className="ml-2 text-xs text-muted">{formatDate(m.matchDate)}</span>
                {m.venue && <span className="ml-2 text-xs text-muted">@{m.venue}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !data || data.matches.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card">
            <EmptyState
              icon={<Trophy className="h-6 w-6" />}
              title="No matches yet"
              description="Record your first match and player scorecards."
            />
          </div>
        ) : (
          data.matches.map((m) => (
            <div key={m.id} className="rounded-2xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <p className="font-bold">
                    vs {m.opponent}
                    {m.venue && <span className="ml-2 text-xs font-normal text-muted">@{m.venue}</span>}
                  </p>
                  <p className="text-xs text-muted">{formatDate(m.matchDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.result && (
                    <Badge
                      tone={
                        m.result === "WON"
                          ? "green"
                          : m.result === "LOST"
                            ? "red"
                            : "gray"
                      }
                    >
                      {matchResultLabel[m.result]}
                    </Badge>
                  )}
                  <button
                    onClick={() => openEdit(m)}
                    className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                    aria-label="Edit match"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {m.records.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted">No scorecard recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Player</th>
                        <th className="px-4 py-2 font-semibold">Runs</th>
                        <th className="hidden px-4 py-2 font-semibold sm:table-cell">Balls</th>
                        <th className="px-4 py-2 font-semibold">Wkts</th>
                        <th className="hidden px-4 py-2 font-semibold sm:table-cell">Ct</th>
                        <th className="px-4 py-2 font-semibold">MOTM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {m.records.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <Avatar src={r.student.photoUrl} name={r.student.fullName} size={26} />
                              <span className="font-medium">{r.student.fullName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 font-semibold">{r.runs}</td>
                          <td className="hidden px-4 py-2 text-muted sm:table-cell">{r.ballsFaced ?? "—"}</td>
                          <td className="px-4 py-2">{r.wickets}</td>
                          <td className="hidden px-4 py-2 text-muted sm:table-cell">{r.catches}</td>
                          <td className="px-4 py-2">
                            {r.manOfTheMatch ? (
                              <Badge tone="gold">MOTM</Badge>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {motmCount(m) === 0 && m.records.length > 0 && (
                <p className="px-4 py-2 text-xs text-muted">No man of the match awarded.</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Match form modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? "Edit Match" : "New Match"}
        size="xl"
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Opponent *</span>
              <input
                className="input"
                value={form.opponent}
                onChange={(e) => setForm({ ...form, opponent: e.target.value })}
                placeholder="e.g. Lahore Lions"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Date *</span>
              <input
                type="date"
                className="input"
                value={form.matchDate}
                onChange={(e) => setForm({ ...form, matchDate: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Venue</span>
              <input
                className="input"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g. YFA Ground"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Result</span>
              <select
                className="input"
                value={form.result}
                onChange={(e) => setForm({ ...form, result: e.target.value })}
              >
                <option value="">Not played / pending</option>
                {MATCH_RESULTS.map((r) => (
                  <option key={r} value={r}>
                    {matchResultLabel[r]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Scorecard — add players
            </p>
            <SearchBar
              value={q}
              onChange={(v) => {
                setQ(v);
                void searchStudents(v);
              }}
              placeholder="Search student to add…"
              className="mb-2"
            />
            {searchResults.length > 0 && (
              <ul className="mb-3 max-h-40 overflow-auto rounded-xl border border-border bg-surface-alt">
                {searchResults.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => addRow(s)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-border"
                    >
                      {s.fullName} <span className="text-xs text-muted">{s.studentId}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {rows.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Player</th>
                      <th className="px-3 py-2 font-semibold">Runs</th>
                      <th className="px-3 py-2 font-semibold">Balls</th>
                      <th className="px-3 py-2 font-semibold">Wkts</th>
                      <th className="px-3 py-2 font-semibold">Ct</th>
                      <th className="px-3 py-2 font-semibold">MOTM</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r, i) => (
                      <tr key={r.studentId}>
                        <td className="px-3 py-2 font-medium">
                          {data?.students.find((s) => s.id === r.studentId)?.fullName ?? r.studentId}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            className="input h-8 w-16 px-2 text-sm"
                            value={r.runs}
                            onChange={(e) => updateRow(i, { runs: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            className="input h-8 w-16 px-2 text-sm"
                            value={r.ballsFaced ?? ""}
                            placeholder="—"
                            onChange={(e) =>
                              updateRow(i, {
                                ballsFaced: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            className="input h-8 w-16 px-2 text-sm"
                            value={r.wickets}
                            onChange={(e) => updateRow(i, { wickets: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            className="input h-8 w-16 px-2 text-sm"
                            value={r.catches}
                            onChange={(e) => updateRow(i, { catches: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={r.manOfTheMatch}
                            onChange={(e) => updateRow(i, { manOfTheMatch: e.target.checked })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                            className="rounded p-1 text-danger hover:bg-danger/10"
                            aria-label="Remove"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={pending} disabled={!form.opponent}>
              {editId ? "Save Changes" : "Save Match"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
