"use client";

import { useState, useTransition } from "react";
import { UserPlus, Power, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { inviteCoachAction, deactivateCoachAction, reactivateCoachAction } from "@/app/actions/misc";
import { useToast } from "@/components/providers/toast-provider";

type CoachRow = {
  id: string;
  fullName: string;
  email: string;
  mobile: string | null;
  status: string;
  createdAt: string;
  coachProfile: { specialization: string | null } | null;
  coachStudents: { id: string }[];
  batches: { id: string; name: string }[];
};

export function CoachesList({
  user,
  coaches,
}: {
  user: { role: string };
  coaches: CoachRow[];
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", mobile: "" });
  const [tempPwd, setTempPwd] = useState<string | null>(null);
  const [error, setError] = useState("");

  const invite = () => {
    setError("");
    startTransition(async () => {
      const res = await inviteCoachAction(form);
      if (res.ok) {
        setTempPwd(res.temporaryPassword);
        setForm({ fullName: "", email: "", mobile: "" });
      } else {
        setError(res.error);
      }
    });
  };

  const toggleStatus = (c: CoachRow) => {
    startTransition(async () => {
      if (c.status === "ACTIVE") {
        await deactivateCoachAction(c.id);
        toast(`${c.fullName} deactivated`, "info");
      } else {
        await reactivateCoachAction(c.id);
        toast(`${c.fullName} reactivated`, "success");
      }
      window.location.reload();
    });
  };

  return (
    <div>
      {user.role === "ADMIN" && (
        <div className="mb-5 flex justify-end">
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="h-4 w-4" /> Invite coach
          </Button>
        </div>
      )}

      {coaches.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted">
          No coaches yet. Invite one to assign students and batches.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coaches.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <Avatar src={null} name={c.fullName} size={44} />
                <div className="min-w-0">
                  <p className="truncate font-bold">{c.fullName}</p>
                  <p className="truncate text-xs text-muted">{c.email}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone={c.status === "ACTIVE" ? "green" : "gray"}>
                  {c.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
                <Badge tone="navy">{c.coachStudents.length} students</Badge>
                <Badge tone="gold">{c.batches.length} batches</Badge>
              </div>
              {c.coachProfile?.specialization && (
                <p className="mt-3 text-xs text-muted">{c.coachProfile.specialization}</p>
              )}
              {c.batches.length > 0 && (
                <p className="mt-1 text-xs text-muted">Batches: {c.batches.map((b) => b.name).join(", ")}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted">Joined {formatDate(c.createdAt)}</span>
                {user.role === "ADMIN" && (
                  <Button
                    variant={c.status === "ACTIVE" ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => toggleStatus(c)}
                    loading={pending}
                  >
                    {c.status === "ACTIVE" ? <Power className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    {c.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite a coach">
        {tempPwd ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
              <p className="text-sm font-bold">Temporary password</p>
              <p className="mt-1 break-all font-mono text-lg font-black text-navy dark:text-white">
                {tempPwd}
              </p>
              <p className="mt-2 text-xs text-muted">
                Share this with the coach. They should change it after first sign-in.
              </p>
            </div>
            <Button className="w-full" onClick={() => setTempPwd(null)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Full name *</span>
              <input
                className="input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Email *</span>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Mobile</span>
              <input
                className="input"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="+91…"
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button onClick={invite} loading={pending} disabled={!form.fullName.trim() || !form.email.trim()}>
                Create account
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}