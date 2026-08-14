import "server-only";
import { db } from "@/lib/db";
import { studentScopeWhere } from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth";
import type { CareerStat } from "@/lib/career-types";

export type CareerCategory = "RUNS" | "WICKETS" | "CATCHES" | "RATING" | "MOTM";

export async function getCareerStats(
  user: SessionUser,
  opts: { studentId?: string } = {}
): Promise<CareerStat[]> {
  const scope = studentScopeWhere(user);
  const records = await db.matchRecord.findMany({
    where: {
      ...(opts.studentId ? { studentId: opts.studentId } : {}),
      student: { ...scope, deletedAt: null },
    },
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          fullName: true,
          photoUrl: true,
          playingRole: true,
          skillLevel: true,
        },
      },
    },
  });

  const map = new Map<string, CareerStat>();
  for (const r of records) {
    let s = map.get(r.studentId);
    if (!s) {
      s = {
        student: r.student,
        matches: 0,
        innings: 0,
        runs: 0,
        highScore: 0,
        average: null,
        strikeRate: null,
        fifties: 0,
        hundreds: 0,
        fours: 0,
        sixes: 0,
        notOuts: 0,
        wickets: 0,
        bestBowling: null,
        economy: null,
        catches: 0,
        runOuts: 0,
        stumpings: 0,
        motm: 0,
        lastRating: null,
        ballsFacedTotal: 0,
        oversTotal: 0,
        runsConcededTotal: 0,
      };
      map.set(r.studentId, s);
    }
    s.matches += 1;
    if (r.ballsFaced && r.ballsFaced > 0) {
      s.innings += 1;
      s.ballsFacedTotal += r.ballsFaced;
    }
    s.runs += r.runs;
    s.fours += r.fours ?? 0;
    s.sixes += r.sixes ?? 0;
    if (r.runs >= 100) s.hundreds += 1;
    else if (r.runs >= 50) s.fifties += 1;
    if (r.runs >= s.highScore) s.highScore = r.runs;
    if ((r.dismissal === "NOT_OUT" || r.dismissal === "RETIRED") && r.ballsFaced && r.ballsFaced > 0) {
      s.notOuts += 1;
    }
    s.wickets += r.wickets ?? 0;
    if (r.wickets && r.wickets > 0) {
      const bb = { wickets: r.wickets, runsConceded: r.runsConceded ?? 0 };
      if (
        !s.bestBowling ||
        bb.wickets > s.bestBowling.wickets ||
        (bb.wickets === s.bestBowling.wickets && bb.runsConceded < s.bestBowling.runsConceded)
      ) {
        s.bestBowling = bb;
      }
    }
    s.oversTotal += r.oversBowled ?? 0;
    s.runsConcededTotal += r.runsConceded ?? 0;
    s.catches += r.catches ?? 0;
    s.runOuts += r.runOuts ?? 0;
    s.stumpings += r.stumpings ?? 0;
    if (r.manOfTheMatch) s.motm += 1;
  }

  for (const s of map.values()) {
    const dismissals = s.innings - s.notOuts;
    s.average = dismissals > 0 ? Math.round((s.runs / dismissals) * 100) / 100 : s.runs > 0 ? s.runs : null;
    s.strikeRate = s.ballsFacedTotal > 0 ? Math.round((s.runs / s.ballsFacedTotal) * 1000) / 10 : null;
    s.economy = s.oversTotal > 0 ? Math.round((s.runsConcededTotal / s.oversTotal) * 100) / 100 : null;
  }

  const perf = await db.performance.findMany({
    where: {
      ...(opts.studentId ? { studentId: opts.studentId } : {}),
      student: { ...scope, deletedAt: null },
    },
    orderBy: { date: "desc" },
    select: { studentId: true, overallRating: true },
  });
  const lastByStudent = new Map<string, number>();
  for (const p of perf) {
    if (!lastByStudent.has(p.studentId)) lastByStudent.set(p.studentId, p.overallRating);
  }

  const result = Array.from(map.values());
  for (const s of result) {
    s.lastRating = lastByStudent.get(s.student.id) ?? null;
  }

  const studentsWithPerf = new Set(perf.map((p) => p.studentId));
  if (!opts.studentId) {
    const missing = await db.student.findMany({
      where: { ...scope, deletedAt: null, id: { notIn: map.size ? Array.from(map.keys()) : [] } },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        photoUrl: true,
        playingRole: true,
        skillLevel: true,
      },
    });
    for (const st of missing) {
      if (!studentsWithPerf.has(st.id)) continue;
      result.push({
        student: st,
        matches: 0,
        innings: 0,
        runs: 0,
        highScore: 0,
        average: null,
        strikeRate: null,
        fifties: 0,
        hundreds: 0,
        fours: 0,
        sixes: 0,
        notOuts: 0,
        wickets: 0,
        bestBowling: null,
        economy: null,
        catches: 0,
        runOuts: 0,
        stumpings: 0,
        motm: 0,
        lastRating: lastByStudent.get(st.id) ?? null,
        ballsFacedTotal: 0,
        oversTotal: 0,
        runsConcededTotal: 0,
      });
    }
  }

  return result;
}