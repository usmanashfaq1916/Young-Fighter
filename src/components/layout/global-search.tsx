"use client";

import { useState } from "react";
import { useEffect } from "react";
import { Search, X, Users } from "lucide-react";
import { searchStudents } from "@/app/actions/students";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { skillLabel } from "@/lib/constants";
import { useDebouncedCallback } from "@/hooks/use-debounce";

type SearchResult = {
  id: string;
  studentId: string;
  fullName: string;
  guardianName: string;
  mobile: string;
  skillLevel: string;
  photoUrl: string | null;
  status: string;
};

export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchStudents(q.trim());
      setResults(res);
    } finally {
      setLoading(false);
    }
  }, 250);

  useEffect(() => {
    if (open) {
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search students"
      className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto mt-16 w-[92%] max-w-xl overflow-hidden rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              void runSearch(e.target.value);
            }}
            placeholder="Search by name, ID, guardian, mobile or WhatsApp…"
            aria-label="Search students"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="rounded-lg p-1.5 text-muted hover:bg-surface-alt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto">
          {loading && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Searching…
            </p>
          )}
          {!loading && results.length === 0 && query && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No students found.
            </p>
          )}
          {results.map((s) => (
            <Link
              key={s.id}
              href={`/students/${s.id}`}
              onClick={onClose}
              className="flex items-center gap-3 border-b border-border px-4 py-3 transition last:border-0 hover:bg-surface-alt"
            >
              <Avatar src={s.photoUrl} name={s.fullName} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {s.fullName}
                </p>
                <p className="truncate text-xs text-muted">
                  {s.studentId} · {s.guardianName} · {s.mobile}
                </p>
              </div>
              <Badge tone="gold">{skillLabel[s.skillLevel]}</Badge>
            </Link>
          ))}
          {!loading && !query && (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-muted">
              <Users className="h-8 w-8" />
              <p className="text-sm">Type to search students</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
