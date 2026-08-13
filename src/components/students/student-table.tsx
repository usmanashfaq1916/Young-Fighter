"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreVertical, Phone, QrCode } from "lucide-react";
import { SearchBar, FilterPill } from "@/components/ui/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { cn, formatMoney } from "@/lib/utils";
import {
  setStudentStatusAction,
  deleteStudentAction,
} from "@/app/actions/students";

type StudentRow = {
  id: string;
  studentId: string;
  fullName: string;
  guardianName: string | null;
  mobile: string | null;
  batch: { id: string; name: string } | null;
  skillLevel: string;
  monthlyFee: number;
  status: string;
  gender: string;
  photoUrl: string | null;
  joinDate: string | Date;
};

type PageData = {
  students: StudentRow[];
  batches: { id: string; name: string }[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

export function StudentTable({
  initial,
  role,
}: {
  initial: PageData;
  role: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const [batch, setBatch] = useState("");
  const [skill, setSkill] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const [sort, setSort] = useState("name");
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<{
    type: "status" | "delete";
    student: StudentRow;
  } | null>(null);

  const fetchPage = useCallback(
    async (page: number) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (debouncedQ) params.set("q", debouncedQ);
      if (batch) params.set("batch", batch);
      if (skill) params.set("skill", skill);
      if (status) params.set("status", status);
      if (gender) params.set("gender", gender);
      if (sort) params.set("sort", sort);
      try {
        const res = await fetch(`/api/students?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, batch, skill, status, gender, sort]
  );

  useEffect(() => {
    const t = setTimeout(() => void fetchPage(1), 0);
    return () => clearTimeout(t);
  }, [debouncedQ, batch, skill, status, gender, sort, fetchPage]);

  const runAction = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn();
      setConfirm(null);
      fetchPage(data.page);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search name, ID, guardian, phone…"
          className="w-full sm:w-80"
        />
        <div className="flex flex-wrap items-center gap-3">
          <FilterPill
            label="Batch"
            value={batch}
            onChange={setBatch}
            options={data.batches.map((b) => ({ value: b.id, label: b.name }))}
          />
          <FilterPill
            label="Skill"
            value={skill}
            onChange={setSkill}
            options={[
              { value: "BEGINNER", label: "Beginner" },
              { value: "INTERMEDIATE", label: "Intermediate" },
              { value: "ADVANCED", label: "Advanced" },
              { value: "PROFESSIONAL", label: "Professional" },
            ]}
          />
          <FilterPill
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
          <FilterPill
            label="Gender"
            value={gender}
            onChange={setGender}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input h-9 w-auto py-1.5 text-xs"
            aria-label="Sort"
          >
            <option value="name">Sort: Name</option>
            <option value="id">Sort: ID</option>
            <option value="joinDate">Sort: Newest</option>
            <option value="fee">Sort: Fee</option>
          </select>
          <Button onClick={() => router.push("/students/new")}>
            <Plus className="h-4 w-4" /> Add Student
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
        ) : data.students.length === 0 ? (
          <EmptyState
            icon={<Phone className="h-6 w-6" />}
            title="No students found"
            description={
              q || batch || skill || status || gender
                ? "Try adjusting your search or filters."
                : "Register your first student to get started."
            }
            action={
              !q && !batch && !skill && !status && !gender ? (
                <Button onClick={() => router.push("/students/new")}>
                  <Plus className="h-4 w-4" /> Add Student
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">
                    Batch
                  </th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                    Guardian
                  </th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                    Contact
                  </th>
                  {role === "ADMIN" && (
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                      Fee
                    </th>
                  )}
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.students.map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer transition hover:bg-surface-alt"
                    onClick={() => router.push(`/students/${s.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={s.photoUrl} name={s.fullName} size={38} />
                        <div>
                          <p className="font-semibold">{s.fullName}</p>
                          <p className="text-xs text-muted">
                            {s.studentId} ·{" "}
                            <span className="capitalize">
                              {s.skillLevel.toLowerCase()}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">
                      {s.batch?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted lg:table-cell">
                      {s.guardianName ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted lg:table-cell">
                      {s.mobile ?? "—"}
                    </td>
                    {role === "ADMIN" && (
                      <td className="hidden px-4 py-3 font-medium sm:table-cell">
                        {formatMoney(s.monthlyFee)}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Badge tone={s.status === "ACTIVE" ? "green" : "red"}>
                        {s.status === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          title="QR Card"
                          onClick={() => router.push(`/students/${s.id}?tab=qr`)}
                          className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => router.push(`/students/${s.id}/edit`)}
                          className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {role === "ADMIN" && (
                          <>
                            <button
                              title={
                                s.status === "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              onClick={() =>
                                setConfirm({ type: "status", student: s })
                              }
                              className={cn(
                                "rounded-lg p-2 transition",
                                s.status === "ACTIVE"
                                  ? "text-warning hover:bg-warning/10"
                                  : "text-success hover:bg-success/10"
                              )}
                            >
                              {s.status === "ACTIVE" ? "⏸" : "▶"}
                            </button>
                            <button
                              title="Delete"
                              onClick={() =>
                                setConfirm({ type: "delete", student: s })
                              }
                              className="rounded-lg p-2 text-danger transition hover:bg-danger/10"
                            >
                              ✕
                            </button>
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
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={fetchPage}
        />
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const c = confirm;
          if (!c) return;
          runAction(() =>
            c.type === "status"
              ? setStudentStatusAction(
                  c.student.id,
                  c.student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                )
              : deleteStudentAction(c.student.id)
          );
        }}
        loading={pending}
        title={
          confirm?.type === "status"
            ? confirm.student.status === "ACTIVE"
              ? "Deactivate student?"
              : "Activate student?"
            : "Delete student?"
        }
        message={
          confirm?.type === "status"
            ? `${confirm.student.fullName} will be ${
                confirm.student.status === "ACTIVE" ? "deactivated" : "reactivated"
              }.`
            : `${confirm?.student.fullName} will be removed from the academy. This can be undone by an admin.`
        }
        confirmLabel={confirm?.type === "status" ? "Confirm" : "Delete"}
      />
    </div>
  );
}
