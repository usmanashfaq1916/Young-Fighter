"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, X, BellRing, Loader2, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ScanStudent = {
  id: string;
  studentId: string;
  fullName: string;
  photoUrl: string | null;
  batch: { name: string } | null;
};

export function ScanResult({
  todayLabel,
  baseUrl,
}: {
  todayLabel: string;
  baseUrl: string;
}) {
  const [status, setStatus] = useState<"loading" | "idle" | "done" | "error">("loading");
  const [student, setStudent] = useState<ScanStudent | null>(null);
  const [todayStatus, setTodayStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "";

  useEffect(() => {
    fetch(`/api/scan/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Scan failed");
        const data = await res.json();
        setStudent(data.student);
        setTodayStatus(data.todayStatus);
        setStatus("idle");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, [token]);

  const mark = async (s: "PRESENT" | "ABSENT" | "LEAVE") => {
    setMarking(s);
    setError("");
    try {
      const res = await fetch(`/api/scan/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setTodayStatus(s);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark attendance");
    } finally {
      setMarking(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-navy px-4">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm text-white/60">Verifying code…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-navy px-4 text-center">
        <X className="h-10 w-10 text-danger" />
        <h1 className="text-xl font-black text-white">{error}</h1>
        {error === "Unauthorized" && (
          <>
            <p className="max-w-sm text-sm text-white/60">
              Sign in with an admin or coach account to verify students and mark attendance.
            </p>
            <Link href={`/login?next=${encodeURIComponent(`/scan/${token}`)}`}>
              <Button>
                <LogIn className="h-4 w-4" /> Sign in to continue
              </Button>
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lg">
        {student ? (
          <div className="flex flex-col items-center text-center">
            {student.photoUrl ? (
              <Image
                src={student.photoUrl}
                alt={student.fullName}
                width={96}
                height={96}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-navy text-3xl font-black text-gold-light">
                {student.fullName.charAt(0)}
              </div>
            )}
            <h1 className="mt-3 text-2xl font-black">{student.fullName}</h1>
            <p className="text-sm text-muted">
              {student.studentId}
              {student.batch?.name ? ` · ${student.batch.name}` : ""}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <Check className="h-10 w-10 text-success" />
            <h1 className="mt-2 text-xl font-black">Valid academy code</h1>
            <p className="text-sm text-muted">Student identity is shown to authorized staff.</p>
          </div>
        )}

        <div className="my-5 rounded-2xl bg-surface-alt px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Attendance · {todayLabel}
          </p>
          {todayStatus ? (
            <Badge
              tone={todayStatus === "PRESENT" ? "green" : todayStatus === "ABSENT" ? "red" : "gold"}
              className="mt-1"
            >
              Already marked {todayStatus}
            </Badge>
          ) : status === "done" ? (
            <Badge tone="green" className="mt-1">
              <Check className="h-3 w-3" /> Marked successfully
            </Badge>
          ) : (
            <p className="mt-1 text-sm text-muted">Not yet marked today</p>
          )}
        </div>

        {error && <p className="mb-3 text-center text-sm text-danger">{error}</p>}

        {!todayStatus && (
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => mark("PRESENT")} loading={marking === "PRESENT"}>
              <Check className="h-4 w-4" /> Present
            </Button>
            <Button variant="outline" onClick={() => mark("ABSENT")} loading={marking === "ABSENT"}>
              <X className="h-4 w-4" /> Absent
            </Button>
            <Button variant="gold" onClick={() => mark("LEAVE")} loading={marking === "LEAVE"}>
              <BellRing className="h-4 w-4" /> Leave
            </Button>
          </div>
        )}

        <p className="mt-5 text-center text-xs text-muted">
          Scan via {baseUrl || "this app"} · Marking is recorded against today&apos;s date
        </p>
      </div>
    </div>
  );
}