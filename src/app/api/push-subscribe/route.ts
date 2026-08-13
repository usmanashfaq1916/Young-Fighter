import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("ADMIN", "COACH", "STUDENT", "PARENT").catch(
      () => null
    );
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (!body.endpoint) {
      return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
    }

    await db.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: {
        userId: user.id,
        keys: body.keys ? (body.keys as object) : Prisma.JsonNull,
      },
      create: {
        userId: user.id,
        endpoint: body.endpoint,
        keys: body.keys ? (body.keys as object) : Prisma.JsonNull,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push subscribe failed:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}