"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GENDERS, genderLabel, PLAYING_ROLES, playingRoleLabel } from "@/lib/constants";
import { submitAdmissionAction } from "@/app/actions/admissions";
import { useToast } from "@/components/providers/toast-provider";

type BatchOpt = { id: string; name: string };

const defaultForm = {
  studentName: "",
  dob: "",
  gender: "",
  guardianName: "",
  phone: "",
  email: "",
  preferredBatchId: "",
  experience: "",
  playingRole: "",
  message: "",
};

export function AdmissionsApply({ batches }: { batches: BatchOpt[] }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(defaultForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [done, setDone] = useState(false);

  const submit = () => {
    setFieldErrors({});
    startTransition(async () => {
      const res = await submitAdmissionAction(form);
      if (res.ok) {
        setDone(true);
      } else {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast(res.error, "error");
      }
    });
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Application submitted!</h2>
        <p className="mt-2 text-sm text-muted">
          Thank you — the academy team will review your application and contact
          you shortly at the number you provided.
        </p>
        <Button
          className="mt-6"
          variant="secondary"
          onClick={() => {
            setForm(defaultForm);
            setDone(false);
          }}
        >
          Submit another application
        </Button>
      </div>
    );
  }

  const err = (key: string) =>
    fieldErrors[key]?.[0] ? (
      <span className="text-xs text-danger">{fieldErrors[key][0]}</span>
    ) : null;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold-light">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Admission Application</h2>
          <p className="text-xs text-muted">
            Fill in the form and the academy team will get back to you.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Student full name *
          </span>
          <input
            type="text"
            className="input"
            value={form.studentName}
            onChange={(e) => setForm({ ...form, studentName: e.target.value })}
            placeholder="e.g. Ali Raza"
          />
          {err("studentName")}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Date of birth *
          </span>
          <input
            type="date"
            className="input"
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
          />
          {err("dob")}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Gender *
          </span>
          <select
            className="input"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="">Select gender…</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {genderLabel[g]}
              </option>
            ))}
          </select>
          {err("gender")}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Guardian name *
          </span>
          <input
            type="text"
            className="input"
            value={form.guardianName}
            onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
            placeholder="e.g. Muhammad Raza"
          />
          {err("guardianName")}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Phone / WhatsApp *
          </span>
          <input
            type="tel"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="03xx xxxxxxx"
          />
          {err("phone")}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Email
          </span>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
          {err("email")}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Preferred batch
          </span>
          <select
            className="input"
            value={form.preferredBatchId}
            onChange={(e) => setForm({ ...form, preferredBatchId: e.target.value })}
          >
            <option value="">No preference</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Playing role
          </span>
          <select
            className="input"
            value={form.playingRole}
            onChange={(e) => setForm({ ...form, playingRole: e.target.value })}
          >
            <option value="">Select role…</option>
            {PLAYING_ROLES.map((r) => (
              <option key={r} value={r}>
                {playingRoleLabel[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Cricket experience
          </span>
          <input
            type="text"
            className="input"
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            placeholder="e.g. 2 years club cricket"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Message
        </span>
        <textarea
          className="input min-h-24"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Anything you'd like the academy to know"
        />
        {err("message")}
      </label>

      <div className="mt-6 flex justify-end">
        <Button onClick={submit} loading={pending}>
          Submit Application
        </Button>
      </div>
    </div>
  );
}