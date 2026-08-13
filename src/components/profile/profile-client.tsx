"use client";

import { useState, useTransition } from "react";
import { Shield, KeyRound, GraduationCap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { changePasswordAction, updateProfileAction } from "@/app/actions/auth";
import { useToast } from "@/components/providers/toast-provider";

type ProfileUser = {
  email: string;
  fullName: string;
  mobile: string | null;
  role: string;
  createdAt: string;
};

export function ProfileClient({
  user,
  student,
  linkedChildren,
}: {
  user: ProfileUser;
  student: { fullName: string; studentId: string; photoUrl: string | null; batch: { name: string } | null } | null;
  linkedChildren: { id: string; fullName: string; studentId: string }[];
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(user.fullName);
  const [mobile, setMobile] = useState(user.mobile ?? "");
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");

  const saveProfile = () => {
    startTransition(async () => {
      const res = await updateProfileAction({ fullName: name, mobile });
      if (res.success) toast("Profile updated", "success");
      else toast(res.error ?? "Failed to update", "error");
    });
  };

  const savePassword = () => {
    setPwdError("");
    if (pwd.next !== pwd.confirm) {
      setPwdError("New passwords don't match.");
      return;
    }
    startTransition(async () => {
      const res = await changePasswordAction({
        currentPassword: pwd.current,
        newPassword: pwd.next,
        confirm: pwd.confirm,
      });
      if (res.success) {
        toast("Password changed. You'll be asked to sign in again.", "success");
        setPwd({ current: "", next: "", confirm: "" });
      } else {
        setPwdError(res.error ?? (res.fieldErrors ? Object.values(res.fieldErrors).flat().join(", ") : "Failed"));
      }
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="mx-auto w-fit">
            <Avatar src={student?.photoUrl ?? null} name={user.fullName} size={72} />
          </div>
          <h2 className="mt-3 text-lg font-black">{user.fullName}</h2>
          <p className="text-sm text-muted">{user.email}</p>
          <Badge tone="navy" className="mt-2">
            {user.role}
          </Badge>
          {student && (
            <div className="mt-4 rounded-xl bg-surface-alt px-4 py-3 text-left text-sm">
              <p className="flex items-center gap-2 font-semibold">
                <GraduationCap className="h-4 w-4 text-primary" /> {student.fullName}
              </p>
              <p className="text-xs text-muted">
                {student.studentId}
                {student.batch?.name ? ` · ${student.batch.name}` : ""}
              </p>
            </div>
          )}
          {linkedChildren.length > 0 && (
            <div className="mt-4 rounded-xl bg-surface-alt px-4 py-3 text-left text-sm">
              <p className="flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4 text-primary" /> Linked to {linkedChildren.length} student(s)
              </p>
              <p className="text-xs text-muted">{linkedChildren.map((c) => c.fullName).join(", ")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5 lg:col-span-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
            <Shield className="h-4 w-4 text-primary" /> Account details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Full name</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Mobile</span>
              <input
                className="input"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91…"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveProfile} loading={pending} disabled={!name.trim()}>
              Save changes
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
            <KeyRound className="h-4 w-4 text-primary" /> Change password
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Current</span>
              <input
                className="input"
                type="password"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">New</span>
              <input
                className="input"
                type="password"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Confirm</span>
              <input
                className="input"
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              />
            </label>
          </div>
          {pwdError && <p className="mt-3 text-sm text-danger">{pwdError}</p>}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={savePassword}
              loading={pending}
              disabled={!pwd.current || !pwd.next || !pwd.confirm}
            >
              Update password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}