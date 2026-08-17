"use client";

import { useState, useTransition } from "react";
import { UserPlus, Power, UserCheck, Link2, KeyRound, Users as UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import {
  createUserAction,
  updateUserRoleAction,
  setUserStatusAction,
  assignCoachToStudentsAction,
  linkParentStudentsAction,
  resetUserPasswordAction,
} from "@/app/actions/users";
import { useToast } from "@/components/providers/toast-provider";

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  mobile: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  studentId: string | null;
  coachProfile: { specialization: string | null } | null;
  coachStudents: { id: string }[];
  batches: { id: string; name: string }[];
  parentLinks: { student: { id: string; fullName: string; studentId: string } }[];
  student: { id: string; fullName: string; studentId: string } | null;
};

type CoachRow = { id: string; fullName: string };
type StudentRow = { id: string; fullName: string; studentId: string; coachId: string | null };

const ROLE_OPTIONS = ["ADMIN", "COACH", "STUDENT", "PARENT"];

export function UsersClient({
  currentUser,
  users,
  coaches,
  students,
}: {
  currentUser: { id: string };
  users: UserRow[];
  coaches: CoachRow[];
  students: StudentRow[];
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [createRole, setCreateRole] = useState<"COACH" | "PARENT" | "STUDENT">("PARENT");
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [tempPwd, setTempPwd] = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [assignTarget, setAssignTarget] = useState<{ coachId: string | null; studentIds: string[] }>({
    coachId: null,
    studentIds: [],
  });
  const [showAssign, setShowAssign] = useState(false);

  const [linkTarget, setLinkTarget] = useState<{ parentId: string; studentIds: string[] }>({
    parentId: "",
    studentIds: [],
  });
  const [showLink, setShowLink] = useState(false);

  const toggleStudent = (id: string) =>
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  const toggleAssignStudent = (id: string) =>
    setAssignTarget((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter((s) => s !== id)
        : [...prev.studentIds, id],
    }));
  const toggleLinkStudent = (id: string) =>
    setLinkTarget((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter((s) => s !== id)
        : [...prev.studentIds, id],
    }));

  const linkedStudentIds = new Set(
    users.filter((u) => u.role === "STUDENT" && u.studentId).map((u) => u.studentId)
  );
  const availableStudents = students.filter((s) => !linkedStudentIds.has(s.id));

  const createUser = () => {
    setError("");
    startTransition(async () => {
      const res = await createUserAction({
        role: createRole,
        fullName: form.fullName ?? "",
        email: form.email ?? "",
        mobile: form.mobile ?? "",
        password: form.password ?? "",
        specialization: form.specialization,
        studentIds: createRole === "PARENT" ? selectedStudentIds : undefined,
        studentCode: createRole === "STUDENT" ? form.studentCode : undefined,
      });
      if (res.ok) {
        setTempPwd(res.temporaryPassword ?? null);
        setForm({});
        setSelectedStudentIds([]);
        toast("Account created", "success");
      } else {
        setError(res.error);
      }
    });
  };

  const resetPassword = (u: UserRow) => {
    startTransition(async () => {
      const res = await resetUserPasswordAction(u.id);
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      setResetPwd(res.temporaryPassword ?? null);
      toast("Password reset", "success");
    });
  };

  const toggleStatus = (u: UserRow) => {
    startTransition(async () => {
      const res = await setUserStatusAction(u.id, u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      toast(u.status === "ACTIVE" ? "User deactivated" : "User activated", "success");
      window.location.reload();
    });
  };

  const changeRole = (u: UserRow, role: string) => {
    startTransition(async () => {
      const res = await updateUserRoleAction(u.id, role);
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      toast("Role updated", "success");
      window.location.reload();
    });
  };

  const saveAssign = () => {
    startTransition(async () => {
      const res = await assignCoachToStudentsAction(assignTarget.studentIds, assignTarget.coachId);
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      toast("Students assigned", "success");
      setShowAssign(false);
      setAssignTarget({ coachId: null, studentIds: [] });
      window.location.reload();
    });
  };

  const saveLink = () => {
    startTransition(async () => {
      const res = await linkParentStudentsAction(linkTarget.parentId, linkTarget.studentIds);
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      toast("Children linked", "success");
      setShowLink(false);
      setLinkTarget({ parentId: "", studentIds: [] });
      window.location.reload();
    });
  };

  const roleTone = (role: string) =>
    role === "ADMIN" ? "gold" : role === "COACH" ? "navy" : role === "PARENT" ? "blue" : "green";

  return (
    <div>
      <div className="mb-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => { setAssignTarget({ coachId: null, studentIds: [] }); setShowAssign(true); }}>
          <Link2 className="h-4 w-4" /> Assign coach
        </Button>
        <Button variant="outline" onClick={() => { setLinkTarget({ parentId: "", studentIds: [] }); setShowLink(true); }}>
          <UsersIcon className="h-4 w-4" /> Link children
        </Button>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="h-4 w-4" /> Create user
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted">
          No users yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <Avatar src={null} name={u.fullName} size={44} />
                <div className="min-w-0">
                  <p className="truncate font-bold">{u.fullName}</p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge tone={roleTone(u.role) as never}>{u.role}</Badge>
                <Badge tone={u.status === "ACTIVE" ? "green" : "gray"}>
                  {u.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
                {u.role === "COACH" && (
                  <>
                    <Badge tone="navy">{u.coachStudents.length} students</Badge>
                    <Badge tone="gold">{u.batches.length} batches</Badge>
                  </>
                )}
                {u.role === "PARENT" && (
                  <Badge tone="navy">{u.parentLinks.length} children</Badge>
                )}
                {u.role === "STUDENT" && u.student && (
                  <Badge tone="navy">{u.student.fullName}</Badge>
                )}
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted">
                {u.coachProfile?.specialization && <p>Specialization: {u.coachProfile.specialization}</p>}
                {u.parentLinks.length > 0 && (
                  <p>Children: {u.parentLinks.map((l) => l.student.fullName).join(", ")}</p>
                )}
                <p>Joined {formatDate(u.createdAt)}{u.lastLoginAt ? ` · Last login ${formatDate(u.lastLoginAt)}` : ""}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => resetPassword(u)} loading={pending}>
                  <KeyRound className="h-3.5 w-3.5" /> Reset password
                </Button>
                {u.id !== currentUser.id && (
                  <>
                    <select
                      className="input h-9 w-auto max-w-32 py-1 text-xs"
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <Button
                      variant={u.status === "ACTIVE" ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => toggleStatus(u)}
                      loading={pending}
                    >
                      {u.status === "ACTIVE" ? <Power className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  </>
                )}
                {u.id === currentUser.id && (
                  <span className="text-xs text-muted">This is you</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create user" size="lg">
        {tempPwd ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
              <p className="text-sm font-bold">Temporary password</p>
              <p className="mt-1 break-all font-mono text-lg font-black text-navy dark:text-white">{tempPwd}</p>
              <p className="mt-2 text-xs text-muted">
                Share this with the user. They can change it after signing in.
              </p>
            </div>
            <Button className="w-full" onClick={() => setTempPwd(null)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["PARENT", "STUDENT", "COACH"] as const).map((r) => (
                <Button
                  key={r}
                  variant={createRole === r ? "primary" : "outline"}
                  size="sm"
                  onClick={() => { setCreateRole(r); setSelectedStudentIds([]); }}
                >
                  {r}
                </Button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Full name *</span>
              <input className="input" value={form.fullName ?? ""} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Email *</span>
              <input className="input" type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Mobile</span>
              <input className="input" value={form.mobile ?? ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Password {createRole === "COACH" && "(optional — a temporary one is generated)"}
              </span>
              <input className="input" type="password" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>

            {createRole === "COACH" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Specialization</span>
                <input className="input" value={form.specialization ?? ""} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
              </label>
            )}

            {createRole === "STUDENT" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Student *</span>
                <select className="input" value={form.studentCode ?? ""} onChange={(e) => setForm({ ...form, studentCode: e.target.value })}>
                  <option value="">Select a student…</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.studentId}>{s.studentId} — {s.fullName}</option>
                  ))}
                </select>
              </label>
            )}

            {createRole === "PARENT" && (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Linked children</span>
                <div className="grid max-h-52 gap-1.5 overflow-y-auto rounded-xl border border-border p-3">
                  {students.length === 0 && <p className="text-xs text-muted">No students found.</p>}
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                      />
                      <span className="truncate">{s.studentId} — {s.fullName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={createUser} loading={pending} disabled={!form.fullName?.trim() || !form.email?.trim()}>
                Create account
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={resetPwd !== null} onClose={() => setResetPwd(null)} title="Password reset" size="lg">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
            <p className="text-sm font-bold">Temporary password</p>
            <p className="mt-1 break-all font-mono text-lg font-black text-navy dark:text-white">{resetPwd}</p>
            <p className="mt-2 text-xs text-muted">
              Share this with the user. They can change it after signing in. Any existing sessions have been
              signed out.
            </p>
          </div>
          <Button className="w-full" onClick={() => setResetPwd(null)}>Done</Button>
        </div>
      </Modal>

      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Assign coach to students" size="lg">
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Coach</span>
            <select
              className="input"
              value={assignTarget.coachId ?? ""}
              onChange={(e) => setAssignTarget({ ...assignTarget, coachId: e.target.value || null })}
            >
              <option value="">Unassign coach</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          </label>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Students</span>
            <div className="grid max-h-64 gap-1.5 overflow-y-auto rounded-xl border border-border p-3">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={assignTarget.studentIds.includes(s.id)}
                    onChange={() => toggleAssignStudent(s.id)}
                  />
                  <span className="truncate">{s.studentId} — {s.fullName}</span>
                  {s.coachId && <span className="ml-auto shrink-0 text-xs text-muted">has coach</span>}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button onClick={saveAssign} loading={pending} disabled={assignTarget.studentIds.length === 0}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showLink} onClose={() => setShowLink(false)} title="Link children to parent" size="lg">
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Parent</span>
            <select
              className="input"
              value={linkTarget.parentId}
              onChange={(e) => setLinkTarget({ ...linkTarget, parentId: e.target.value })}
            >
              <option value="">Select a parent…</option>
              {users.filter((u) => u.role === "PARENT").map((u) => (
                <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>
              ))}
            </select>
          </label>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Children</span>
            <div className="grid max-h-64 gap-1.5 overflow-y-auto rounded-xl border border-border p-3">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={linkTarget.studentIds.includes(s.id)}
                    onChange={() => toggleLinkStudent(s.id)}
                  />
                  <span className="truncate">{s.studentId} — {s.fullName}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowLink(false)}>Cancel</Button>
            <Button onClick={saveLink} loading={pending} disabled={!linkTarget.parentId}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
