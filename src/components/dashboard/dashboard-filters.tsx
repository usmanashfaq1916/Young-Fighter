"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Filter, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type DashboardFilterValues = {
  month?: string;
  batchId?: string;
  coachId?: string;
  studentStatus?: string;
};

export function DashboardFilters({
  batches,
  coaches,
  current,
}: {
  batches: { id: string; name: string }[];
  coaches: { id: string; fullName: string }[];
  current: DashboardFilterValues;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [month, setMonth] = useState(current.month ?? "");
  const [batchId, setBatchId] = useState(current.batchId ?? "");
  const [coachId, setCoachId] = useState(current.coachId ?? "");
  const [studentStatus, setStudentStatus] = useState(current.studentStatus ?? "ALL");

  const apply = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("month");
    params.delete("batch");
    params.delete("coach");
    params.delete("status");
    if (month) params.set("month", month);
    if (batchId) params.set("batch", batchId);
    if (coachId) params.set("coach", coachId);
    if (studentStatus !== "ALL") params.set("status", studentStatus);
    router.replace(`/dashboard?${params.toString()}`);
  }, [month, batchId, coachId, studentStatus, router, searchParams]);

  const clear = useCallback(() => {
    setMonth("");
    setBatchId("");
    setCoachId("");
    setStudentStatus("ALL");
    router.replace("/dashboard");
  }, [router]);

  const hasActive = !!(month || batchId || coachId || studentStatus !== "ALL");

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <div className="flex items-center gap-2 self-center">
        <Filter className="h-4 w-4 text-muted" />
        <span className="text-sm font-semibold text-foreground">Filters</span>
      </div>
      <Input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="w-40"
        aria-label="Filter by month"
      />
      <Select
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
        options={batches.map((b) => ({ value: b.id, label: b.name }))}
        placeholder="All batches"
        className="w-44"
      />
      <Select
        value={coachId}
        onChange={(e) => setCoachId(e.target.value)}
        options={coaches.map((c) => ({ value: c.id, label: c.fullName }))}
        placeholder="All coaches"
        className="w-44"
      />
      <Select
        value={studentStatus}
        onChange={(e) => setStudentStatus(e.target.value)}
        options={[
          { value: "ALL", label: "All statuses" },
          { value: "ACTIVE", label: "Active only" },
          { value: "INACTIVE", label: "Inactive only" },
        ]}
        placeholder="All statuses"
        className="w-40"
      />
      <Button onClick={apply} size="sm">
        Apply
      </Button>
      {hasActive && (
        <Button onClick={clear} variant="ghost" size="sm">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}