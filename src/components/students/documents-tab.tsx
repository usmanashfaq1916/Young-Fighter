"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Upload, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import {
  uploadStudentDocumentAction,
  deleteStudentDocumentAction,
} from "@/app/actions/documents";
import { useToast } from "@/components/providers/toast-provider";
import { useRouter } from "next/navigation";

type Doc = {
  id: string;
  title: string;
  type: string | null;
  url: string;
  createdAt: string;
  uploader: { fullName: string } | null;
};

export function DocumentsTab({ studentId, documents }: { studentId: string; documents: Doc[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = () => {
    if (!title.trim()) {
      toast("Please enter a document title", "error");
      return;
    }
    if (!file) {
      toast("Please choose a file", "error");
      return;
    }
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      startTransition(async () => {
        const res = await uploadStudentDocumentAction(studentId, {
          title: title.trim(),
          dataUrl: String(reader.result),
        });
        setReading(false);
        if (res.ok) {
          toast("Document uploaded", "success");
          setTitle("");
          setFile(null);
          if (inputRef.current) inputRef.current.value = "";
          router.refresh();
        } else {
          toast(res.error, "error");
        }
      });
    };
    reader.onerror = () => {
      setReading(false);
      toast("Could not read the file", "error");
    };
    reader.readAsDataURL(file);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteStudentDocumentAction(studentId, deleteTarget.id);
      setDeleteTarget(null);
      if (res.ok) {
        toast("Document deleted", "success");
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Upload document
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Title *
            </span>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Birth certificate"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              File (max 8 MB)
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="input cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={upload} loading={pending || reading} disabled={!title.trim() || !file}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Documents ({documents.length})
        </h3>
        {documents.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No documents"
            description="Upload certificates, forms or reports for this student."
          />
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.title}</p>
                  <p className="text-xs text-muted">
                    {d.type ?? "File"} · {formatDate(d.createdAt)}
                    {d.uploader ? ` · by ${d.uploader.fullName}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                    title="Open document"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => setDeleteTarget(d)}
                    className="rounded-lg p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete document?"
        message={`"${deleteTarget?.title}" will be removed permanently.`}
        confirmLabel="Delete"
        danger
        loading={pending}
      />
    </div>
  );
}