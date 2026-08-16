import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentIdsInScope } from "@/lib/rbac";
import { dateOnlyUTC } from "@/lib/utils";
import { logActivity } from "@/lib/activity";
import { feeSchema } from "@/lib/validation/schemas";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { z } from "zod";
import { ATTENDANCE_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const statusSchema = z.enum(ATTENDANCE_STATUSES);

const idempotencySchema = z
  .object({
    entryId: z.string().min(8).max(128).optional(),
  })
  .passthrough();

const attendanceMarkSchema = z.object({
  date: z.coerce.date(),
  studentId: z.string().min(1),
  status: statusSchema,
});

const attendanceBulkSchema = z.object({
  date: z.coerce.date(),
  entries: z.array(
    z.object({ studentId: z.string().min(1), status: statusSchema })
  ),
});

const queuedActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("attendance.mark"), payload: attendanceMarkSchema }),
  z.object({ action: z.literal("attendance.bulk"), payload: attendanceBulkSchema }),
  z.object({ action: z.literal("fee.record"), payload: feeSchema }),
]);

async function claimReplay(entryId?: string): Promise<"processed" | "new" | "skip"> {
  if (!entryId) return "new";
  try {
    await db.offlineSyncRecord.create({ data: { key: entryId } });
    return "new";
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return "processed";
    return "skip";
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRole("ADMIN", "COACH").catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(await clientKey(), { max: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = idempotencySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const entryId = parsed.data.entryId;
  const actionParsed = queuedActionSchema.safeParse({
    action: (body as { action?: string }).action,
    payload: (body as { payload?: unknown }).payload,
  });
  if (!actionParsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const queued = actionParsed.data;

  // fee recording is an ADMIN-only capability (matches recordFeeAction).
  if (queued.action === "fee.record" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const replayStatus = await claimReplay(entryId);
  if (replayStatus === "processed") {
    // Already applied by a previous attempt — acknowledge so the client drops it.
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (replayStatus === "skip") {
    return NextResponse.json({ error: "Replay unavailable" }, { status: 503 });
  }

  try {
    switch (queued.action) {
      case "attendance.mark": {
        const { date, studentId, status } = queued.payload;
        const scoped = new Set(await studentIdsInScope(user));
        if (!scoped.has(studentId)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        const d = dateOnlyUTC(date);
        await db.attendance.upsert({
          where: { studentId_date: { studentId, date: d } },
          update: { status },
          create: { studentId, date: d, status, markedBy: user.id },
        });
        await logActivity({
          userId: user.id,
          type: "ATTENDANCE_MARKED",
          action: "Attendance synced",
          entity: "attendance",
          details: `${studentId} ${status} ${d.toISOString().slice(0, 10)}`,
        });
        break;
      }

      case "attendance.bulk": {
        const { date, entries } = queued.payload;
        if (entries.length === 0) {
          return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }
        const scoped = new Set(await studentIdsInScope(user));
        const allowed = entries.filter((e) => scoped.has(e.studentId));
        if (allowed.length === 0) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        const d = dateOnlyUTC(date);
        const existing = await db.attendance.findMany({
          where: { studentId: { in: allowed.map((e) => e.studentId) }, date: d },
          select: { studentId: true },
        });
        const existingSet = new Set(existing.map((e) => e.studentId));
        await db.$transaction(async (tx) => {
          for (const e of allowed) {
            if (existingSet.has(e.studentId)) {
              await tx.attendance.updateMany({
                where: { studentId: e.studentId, date: d },
                data: { status: e.status },
              });
            } else {
              await tx.attendance.create({
                data: { studentId: e.studentId, date: d, status: e.status, markedBy: user.id },
              });
            }
          }
        });
        await logActivity({
          userId: user.id,
          type: "ATTENDANCE_MARKED",
          action: "Attendance synced (bulk)",
          entity: "attendance",
          details: `${allowed.length} student(s) ${d.toISOString().slice(0, 10)}`,
        });
        break;
      }

      case "fee.record": {
        const p = queued.payload;
        const existing = await db.fee.findUnique({
          where: { studentId_month: { studentId: p.studentId, month: p.month } },
        });
        if (existing) {
          await db.fee.update({
            where: { id: existing.id },
            data: {
              monthlyFee: p.monthlyFee,
              discount: p.discount,
              paidAmount: p.paidAmount,
              balance: p.monthlyFee - p.discount - p.paidAmount,
              paymentDate: p.paymentDate ? dateOnlyUTC(p.paymentDate) : null,
              paymentMethod: (p.paymentMethod as never) ?? null,
              remarks: p.remarks ?? null,
              status:
                p.paidAmount >= p.monthlyFee - p.discount
                  ? "PAID"
                  : p.paidAmount > 0
                    ? "PARTIAL"
                    : "PENDING",
            },
          });
        } else {
          await db.fee.create({
            data: {
              studentId: p.studentId,
              month: p.month,
              monthlyFee: p.monthlyFee,
              discount: p.discount,
              paidAmount: p.paidAmount,
              balance: p.monthlyFee - p.discount - p.paidAmount,
              dueDate: dateOnlyUTC(p.dueDate),
              paymentDate: p.paymentDate ? dateOnlyUTC(p.paymentDate) : null,
              paymentMethod: (p.paymentMethod as never) ?? null,
              remarks: p.remarks ?? null,
              status:
                p.paidAmount >= p.monthlyFee - p.discount
                  ? "PAID"
                  : p.paidAmount > 0
                    ? "PARTIAL"
                    : "PENDING",
              createdBy: user.id,
            },
          });
        }
        await logActivity({
          userId: user.id,
          type: "FEE_RECORDED",
          action: "Fee synced offline",
          entity: "fee",
          details: `${p.studentId} ${p.month}`,
        });
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Offline replay failed:", error);
    return NextResponse.json({ error: "Replay failed" }, { status: 500 });
  }
}
