"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { studentSchema } from "@/lib/validation/schemas";
import {
  createStudentAction,
  updateStudentAction,
} from "@/app/actions/students";
import { SKILL_LEVELS, GENDERS, STUDENT_STATUSES, BLOOD_GROUPS, PLAYING_ROLES, BATTING_STYLES, BOWLING_STYLES } from "@/lib/constants";
import { useToast } from "@/components/providers/toast-provider";

type StudentFormData = {
  fullName: string;
  guardianName: string;
  mobile: string;
  whatsapp?: string;
  dob: string | Date;
  gender: string;
  address?: string;
  joinDate: string | Date;
  batchId?: string;
  skillLevel: string;
  monthlyFee: number;
  emergencyContact?: string;
  bloodGroup?: string;
  email?: string;
  playingRole?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  preferredPosition?: string;
  jerseyNumber?: number | string;
  status: string;
  photoDataUrl?: string | null;
};

const formSchema = studentSchema.extend({
  emergencyContact: z.string().optional().or(z.literal("")),
  bloodGroup: z.string().optional().or(z.literal("")),
  photoDataUrl: z.string().nullable().optional(),
});

const formResolver = zodResolver(formSchema) as unknown as Resolver<StudentFormData>;

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

export function StudentForm({
  student,
  batches,
  defaultJoinDate,
  todayStr,
}: {
  student?: StudentFormData & { id: string; studentId?: string; photoUrl?: string | null };
  batches: { id: string; name: string }[];
  defaultJoinDate?: string;
  todayStr?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [photoValue, setPhotoValue] = useState<string | null>(
    student?.photoUrl ?? null
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: formResolver,
    defaultValues: {
      fullName: "",
      guardianName: "",
      mobile: "",
      whatsapp: "",
      dob: "",
      gender: "MALE",
      address: "",
      joinDate: defaultJoinDate ?? new Date().toISOString().slice(0, 10),
      batchId: "",
      skillLevel: "BEGINNER",
      monthlyFee: 5000,
      emergencyContact: "",
      bloodGroup: "",
      email: "",
      playingRole: "",
      battingStyle: "",
      bowlingStyle: "",
      preferredPosition: "",
      jerseyNumber: "",
      status: "ACTIVE",
      photoDataUrl: null,
      ...(student ?? {}),
    },
  });

  const onSubmit = (values: StudentFormData) => {
    const payload = {
      ...values,
      dob:
        values.dob instanceof Date
          ? values.dob.toISOString().slice(0, 10)
          : String(values.dob),
      joinDate:
        values.joinDate instanceof Date
          ? values.joinDate.toISOString().slice(0, 10)
          : String(values.joinDate),
      monthlyFee: Number(values.monthlyFee),
      jerseyNumber: values.jerseyNumber === "" ? undefined : Number(values.jerseyNumber),
    };
    startTransition(async () => {
      try {
        const res = student
          ? await updateStudentAction(student.id, payload)
          : await createStudentAction(payload);
        if (res.ok) {
          toast(
            student
              ? "Student updated"
              : `Student registered (ID ${"studentId" in res ? res.studentId : ""})`,
            "success"
          );
          router.push(student ? `/students/${student.id}` : "/students");
          router.refresh();
        } else {
          toast(res.error, "error");
        }
      } catch (error) {
        toast(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
          "error"
        );
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-3xl space-y-6"
      noValidate
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">
              {student ? "Edit Student" : "Register New Student"}
            </h1>
            <p className="text-xs text-muted">
              {student
                ? `Updating ${student.fullName}`
                : "Create a new student profile"}
            </p>
          </div>
        </div>
        <Button type="submit" loading={pending}>
          <Save className="h-4 w-4" /> {student ? "Save Changes" : "Register"}
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
          Personal Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" required error={errors.fullName?.message}>
            <input className="input" {...register("fullName")} />
          </Field>
          <Field
            label="Date of Birth"
            required
            error={errors.dob?.message as string | undefined}
          >
            <input
              type="date"
              className="input"
              {...register("dob")}
              max={todayStr ?? new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <Field label="Gender" required error={errors.gender?.message}>
            <select className="input" {...register("gender")}>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0) + g.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Blood Group" error={errors.bloodGroup?.message}>
            <select className="input" {...register("bloodGroup")}>
              <option value="">Select…</option>
              {BLOOD_GROUPS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Address" error={errors.address?.message}>
            <textarea className="input min-h-20" {...register("address")} />
          </Field>
          <div className="sm:col-span-2">
            <FileUpload
              label="Student Photo"
              value={photoValue}
              onChange={(dataUrl) => {
                setPhotoValue(dataUrl);
                setValue("photoDataUrl", dataUrl, { shouldValidate: true });
              }}
              round
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
          Guardian & Contact
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Guardian Name"
            required
            error={errors.guardianName?.message}
          >
            <input className="input" {...register("guardianName")} />
          </Field>
          <Field label="Mobile" required error={errors.mobile?.message}>
            <input className="input" {...register("mobile")} placeholder="03XX-XXXXXXX" />
          </Field>
          <Field label="WhatsApp (optional)" error={errors.whatsapp?.message}>
            <input className="input" {...register("whatsapp")} placeholder="03XX-XXXXXXX" />
          </Field>
          <Field label="Emergency Contact" error={errors.emergencyContact?.message}>
            <input className="input" {...register("emergencyContact")} />
          </Field>
          <Field label="Email (optional)" error={errors.email?.message}>
            <input type="email" className="input" {...register("email")} />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
          Cricket Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Playing Role" error={errors.playingRole?.message}>
            <select className="input" {...register("playingRole")}>
              <option value="">Select…</option>
              {PLAYING_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase().replace("-", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Batting Style" error={errors.battingStyle?.message}>
            <select className="input" {...register("battingStyle")}>
              <option value="">Select…</option>
              {BATTING_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bowling Style" error={errors.bowlingStyle?.message}>
            <select className="input" {...register("bowlingStyle")}>
              <option value="">Select…</option>
              {BOWLING_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preferred Position" error={errors.preferredPosition?.message}>
            <input className="input" {...register("preferredPosition")} placeholder="e.g. Opener, No. 4, First change" />
          </Field>
          <Field label="Jersey Number" error={errors.jerseyNumber?.message}>
            <input
              type="number"
              min={0}
              max={999}
              className="input"
              {...register("jerseyNumber")}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
          Academy Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Batch" error={errors.batchId?.message}>
            <select className="input" {...register("batchId")}>
              <option value="">No batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Skill Level" required error={errors.skillLevel?.message}>
            <select className="input" {...register("skillLevel")}>
              {SKILL_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monthly Fee (Rs.)" required error={errors.monthlyFee?.message}>
            <input
              type="number"
              min={0}
              className="input"
              {...register("monthlyFee")}
            />
          </Field>
          <Field label="Status" required error={errors.status?.message}>
            <select className="input" {...register("status")}>
              {STUDENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Join Date" required error={errors.joinDate?.message}>
            <input type="date" className="input" {...register("joinDate")} />
          </Field>
        </div>
        {student && (
          <p className="mt-4 text-xs text-muted">
            Student ID:{" "}
            <span className="font-semibold text-foreground">{student.studentId}</span>
          </p>
        )}
      </div>
    </form>
  );
}
