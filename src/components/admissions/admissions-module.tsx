"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, UserPlus, Trash2, ClipboardList, Phone, Mail, MessageSquare, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { ADMISSION_STATUSES, admissionStatusLabel } from "@/lib/constants";
import {
  reviewAdmissionAction,
  convertAdmissionAction,
  deleteAdmissionAction,
} from "@/app/actions/admissions";
import { useToast } from "@/components/providers/toast-provider";

type AdmissionRow = {
  id: string;
  studentName: string;
  dob: string;
  guardianName: string;
  phone: string;
  email: string | null;
  preferredBatch: { id: string; name: string } | null;
  experience: string | null;
  playingRole: string | null;
  message: string | null;
  status: string;
  studentId: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const statusTone: Record<string, "gold" | "green" | "blue" | "red" | "gray"> = {
  NEW: "gold",
  REVIEW: "blue",
  APPROVED: "green",
  REJECTED: "red",
  CONVERTED: "gray",
};

export function AdmissionsModule({
  admissions,
}: {
  admissions: AdmissionRow[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [reviewTarget, setReviewTarget] = useState<AdmissionRow | null>(null);
  const [reviewStatus, setReviewStatus] = useState("APPROVED");
  const [convertTarget, setConvertTarget] = useState<AdmissionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdmissionRow | null>(null);

  const filtered = admissions.filter(
    (a) => statusFilter === "ALL" || a.status === statusFilter
  );

  const counts = admissions.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const submitReview = () => {
    if (!reviewTarget) return;
    startTransition(async () => {
      const res = await reviewAdmissionAction({
        admissionId: reviewTarget.id,
        status: reviewStatus,
      });
      if (res.ok) {
        toast("Application updated", "success");
        setReviewTarget(null);
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  };

  const submitConvert = () => {
    if (!convertTarget) return;
    startTransition(async () => {
      const res = await convertAdmissionAction(convertTarget.id);
      if (res.ok) {
        toast(`Student created — ${res.studentId}`, "success");
        setConvertTarget(null);
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="ALL">All applications</option>
          {ADMISSION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {admissionStatusLabel[s]} ({counts[s] ?? 0})
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No admission applications"
          description="New applications submitted from the public site will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{a.studentName}</p>
                    <Badge tone={statusTone[a.status] ?? "gray"}>
                      {admissionStatusLabel[a.status]}
                    </Badge>
                    {a.studentId && <Badge tone="green">Linked</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    Guardian: {a.guardianName} · DOB {formatDate(a.dob)}
                    {a.playingRole ? ` · ${a.playingRole}` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted">Applied {formatDate(a.createdAt)}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {a.phone}
                </span>
                {a.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {a.email}
                  </span>
                )}
                {a.preferredBatch && (
                  <Badge tone="blue">Preferred: {a.preferredBatch.name}</Badge>
                )}
                {a.experience && (
                  <span className="flex items-center gap-1">
                    <History className="h-3 w-3" /> {a.experience}
                  </span>
                )}
              </div>

              {a.message && (
                <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-surface-alt p-3 text-sm text-muted">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {a.message}
                </p>
              )}

              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                {a.status !== "CONVERTED" && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setReviewTarget(a);
                        setReviewStatus("APPROVED");
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setConvertTarget(a)}
                      disabled={a.status === "REJECTED"}
                    >
                      <UserPlus className="h-4 w-4" /> Create Student
                    </Button>
                  </>
                )}
                <button
                  onClick={() => setDeleteTarget(a)}
                  className="rounded-lg p-2 text-danger transition hover:bg-danger/10"
                  aria-label="Delete application"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={`Review — ${reviewTarget?.studentName ?? ""}`}
      >
        <div className="space-y-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Decision *
            </span>
            <select
              className="input"
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
            >
              <option value="NEW">Mark as New</option>
              <option value="REVIEW">Move to Review</option>
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
            </select>
          </label>
          <p className="text-xs text-muted">
            Approved applications can be converted into student records. Rejected
            applications stay archived for reference.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitReview} loading={pending}>
              Save Decision
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        onConfirm={submitConvert}
        loading={pending}
        title="Create student record?"
        message={`This creates a new student account for ${convertTarget?.studentName} (${convertTarget?.preferredBatch?.name ?? "no batch"}), generates their Student ID and QR code, and marks the application as converted.`}
        confirmLabel="Create Student"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          startTransition(async () => {
            const res = await deleteAdmissionAction(deleteTarget.id);
            if (res.ok) {
              toast("Application deleted", "success");
              setDeleteTarget(null);
              router.refresh();
            } else {
              toast(res.error, "error");
            }
          });
        }}
        loading={pending}
        title="Delete application?"
        message={`This will permanently remove ${deleteTarget?.studentName}'s application.`}
        confirmLabel="Delete"
      />
    </div>
  );
}