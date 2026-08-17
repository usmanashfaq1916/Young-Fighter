"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth";
import { assertStudentAccess, studentIdsInScope } from "@/lib/rbac";
import { performanceSchema, matchSchema, matchRecordSchema } from "@/lib/validation/schemas";
import { logActivity } from "@/lib/activity";
import { notifyUsers } from "@/lib/notifications";
import { dateOnlyUTC } from "@/lib/utils";

export type PerformanceActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type SubSkills = {
  batting?: { technique?: number; consistency?: number };
  bowling?: { technique?: number; consistency?: number };
  fielding?: { technique?: number; consistency?: number };
  fitness?: { technique?: number; consistency?: number };
  discipline?: { technique?: number; consistency?: number };
};

export async function addPerformanceAction(input: {
  studentId: string;
  date: string;
  battingRating: number;
  bowlingRating: number;
  fieldingRating: number;
  fitnessRating: number;
  disciplineRating: number;
  subSkills?: SubSkills | null;
  remarks?: string;
}) {
  const user = await requireRole("ADMIN", "COACH");
  if (!(await assertStudentAccess(user, input.studentId))) {
    return { ok: false as const, error: "Access denied." };
  }

  const parsed = performanceSchema.safeParse({
    ...input,
    date: input.date ? new Date(input.date) : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid performance data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const overallRating = Math.round(
    ((data.battingRating +
      data.bowlingRating +
      data.fieldingRating +
      data.fitnessRating +
      data.disciplineRating) /
      5) *
      10
  ) / 10;

  const student = await db.student.findUnique({
    where: { id: data.studentId },
    select: { fullName: true },
  });

  try {
    const perf = await db.performance.create({
      data: {
        studentId: data.studentId,
        date: dateOnlyUTC(data.date),
        battingRating: data.battingRating,
        bowlingRating: data.bowlingRating,
        fieldingRating: data.fieldingRating,
        fitnessRating: data.fitnessRating,
        disciplineRating: data.disciplineRating,
        overallRating,
        subSkills: input.subSkills ? (input.subSkills as object) : undefined,
        remarks: data.remarks || null,
        coachId: user.role === "COACH" ? user.id : null,
      },
    });
    await logActivity({
      userId: user.id,
      type: "PERFORMANCE_ADDED",
      action: "Performance added",
      entity: "performance",
      entityId: perf.id,
      details: `${student?.fullName ?? data.studentId} (${overallRating}/10)`,
    });
    await notifyUsers(user.role === "COACH" ? ["ADMIN"] : "ADMIN", {
      title: "Performance recorded",
      body: `${student?.fullName ?? "A student"} scored ${overallRating}/10 on ${dateOnlyUTC(data.date).toISOString().slice(0, 10)}.`,
    });
    revalidatePath("/performance");
    revalidatePath(`/students/${data.studentId}`);
    return { ok: true as const, id: perf.id };
  } catch (error) {
    console.error("Add performance failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}

export async function updatePerformanceAction(
  id: string,
  input: {
    studentId: string;
    date: string;
    battingRating: number;
    bowlingRating: number;
    fieldingRating: number;
    fitnessRating: number;
    disciplineRating: number;
    subSkills?: SubSkills | null;
    remarks?: string;
  }
) {
  const user = await requireRole("ADMIN", "COACH");
  if (!(await assertStudentAccess(user, input.studentId))) {
    return { ok: false as const, error: "Access denied." };
  }

  const parsed = performanceSchema.safeParse({
    ...input,
    date: input.date ? new Date(input.date) : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid performance data.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const overallRating = Math.round(
    ((data.battingRating +
      data.bowlingRating +
      data.fieldingRating +
      data.fitnessRating +
      data.disciplineRating) /
      5) *
      10
  ) / 10;

  const existing = await db.performance.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, error: "Record not found." };
  // IDOR guard: the target record's owner is what matters, not the
  // client-supplied studentId.
  if (!(await assertStudentAccess(user, existing.studentId))) {
    return { ok: false as const, error: "Access denied." };
  }
  const student = await db.student.findUnique({
    where: { id: data.studentId },
    select: { fullName: true },
  });

  await db.performance.update({
    where: { id },
    data: {
      date: dateOnlyUTC(data.date),
      battingRating: data.battingRating,
      bowlingRating: data.bowlingRating,
      fieldingRating: data.fieldingRating,
      fitnessRating: data.fitnessRating,
      disciplineRating: data.disciplineRating,
      overallRating,
      subSkills: input.subSkills ? (input.subSkills as object) : Prisma.JsonNull,
      remarks: data.remarks || null,
    },
  });
  await logActivity({
    userId: user.id,
    type: "PERFORMANCE_UPDATED",
    action: "Performance updated",
    entity: "performance",
    entityId: id,
    details: `${student?.fullName ?? data.studentId}`,
  });
  revalidatePath("/performance");
  revalidatePath(`/students/${data.studentId}`);
  return { ok: true as const };
}

export async function deletePerformanceAction(id: string) {
  const user = await requireRole("ADMIN", "COACH");
  const perf = await db.performance.findUnique({ where: { id } });
  if (!perf) return { ok: false as const, error: "Record not found." };
  if (!(await assertStudentAccess(user, perf.studentId))) {
    return { ok: false as const, error: "Access denied." };
  }
  await db.performance.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    type: "PERFORMANCE_UPDATED",
    action: "Performance deleted",
    entity: "performance",
    entityId: id,
  });
  revalidatePath("/performance");
  return { ok: true as const };
}

export async function saveMatchAction(input: {
  id?: string;
  matchDate: string;
  opponent: string;
  venue?: string;
  matchType?: string | null;
  competition?: string;
  tossWon?: boolean | null;
  overs?: number | null;
  notes?: string;
  result?: string | null;
  records: {
    studentId: string;
    selected?: boolean;
    battingPosition?: number | null;
    runs: number;
    ballsFaced?: number | null;
    fours?: number;
    sixes?: number;
    dismissal?: string | null;
    wickets: number;
    oversBowled?: number | null;
    maidens?: number;
    runsConceded?: number | null;
    catches: number;
    runOuts?: number;
    stumpings?: number;
    strikeRate?: number | null;
    economy?: number | null;
    manOfTheMatch?: boolean;
  }[];
}) {
  const user = await requireRole("ADMIN", "COACH");

  const parsedMatch = matchSchema.safeParse({
    ...input,
    matchDate: input.matchDate ? new Date(input.matchDate) : undefined,
    result: input.result || null,
    matchType: input.matchType || null,
    tossWon: input.tossWon ?? null,
    overs: input.overs ?? null,
  });
  if (!parsedMatch.success) {
    return { ok: false as const, error: "Invalid match data.", fieldErrors: parsedMatch.error.flatten().fieldErrors };
  }
  const parsedRecords = matchRecordSchema.safeParse({
    matchId: input.id ?? "",
    entries: input.records,
  });
  if (!parsedRecords.success) {
    return { ok: false as const, error: "Invalid match records.", fieldErrors: parsedRecords.error.flatten().fieldErrors };
  }
  const data = { ...parsedMatch.data, records: parsedRecords.data.entries };

  // COACH may only edit matches they own (coachId set at creation).
  if (user.role === "COACH" && input.id) {
    const match = await db.match.findUnique({
      where: { id: input.id },
      select: { coachId: true },
    });
    if (!match || match.coachId !== user.id) {
      return { ok: false as const, error: "Access denied." };
    }
  }

  const scopedIds = new Set(await studentIdsInScope(user));
  const validRecords = data.records.filter((r) => scopedIds.has(r.studentId));

  try {
    let matchId = input.id;
    if (matchId) {
      await db.match.update({
        where: { id: matchId },
        data: {
          matchDate: dateOnlyUTC(data.matchDate),
          opponent: data.opponent,
          venue: data.venue || null,
          matchType: (data.matchType as never) ?? null,
          competition: data.competition || null,
          tossWon: data.tossWon ?? null,
          overs: data.overs ?? null,
          notes: data.notes || null,
          result: (data.result as never) ?? null,
        },
      });
    } else {
      const created = await db.match.create({
        data: {
          matchDate: dateOnlyUTC(data.matchDate),
          opponent: data.opponent,
          venue: data.venue || null,
          matchType: (data.matchType as never) ?? null,
          competition: data.competition || null,
          tossWon: data.tossWon ?? null,
          overs: data.overs ?? null,
          notes: data.notes || null,
          result: (data.result as never) ?? null,
          coachId: user.role === "COACH" ? user.id : null,
          createdBy: user.id,
        },
      });
      matchId = created.id;
    }

    if (matchId) {
      await db.matchRecord.deleteMany({ where: { matchId } });
      if (validRecords.length > 0) {
        await db.matchRecord.createMany({
          data: validRecords.map((r) => ({
            matchId: matchId!,
            studentId: r.studentId,
            selected: r.selected ?? true,
            battingPosition: r.battingPosition ?? null,
            runs: r.runs,
            ballsFaced: r.ballsFaced ?? null,
            fours: r.fours ?? 0,
            sixes: r.sixes ?? 0,
            dismissal: (r.dismissal as never) ?? null,
            wickets: r.wickets,
            oversBowled: r.oversBowled ?? null,
            maidens: r.maidens ?? 0,
            runsConceded: r.runsConceded ?? null,
            catches: r.catches,
            runOuts: r.runOuts ?? 0,
            stumpings: r.stumpings ?? 0,
            strikeRate: r.strikeRate ?? null,
            economy: r.economy ?? null,
            manOfTheMatch: r.manOfTheMatch ?? false,
          })),
        });
      }
    }

    await logActivity({
      userId: user.id,
      type: input.id ? "MATCH_UPDATED" : "MATCH_ADDED",
      action: input.id ? "Match updated" : "Match added",
      entity: "match",
      entityId: matchId!,
      details: `vs ${data.opponent}`,
    });
    revalidatePath("/dashboard/matches");
    revalidatePath("/dashboard");
    revalidatePath("/rankings");
    return { ok: true as const, id: matchId };
  } catch (error) {
    console.error("Save match failed:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }
}
