export type CareerStudent = {
  id: string;
  studentId: string;
  fullName: string;
  photoUrl: string | null;
  playingRole: string | null;
  skillLevel: string;
};

export type CareerStat = {
  student: CareerStudent;
  matches: number;
  innings: number;
  runs: number;
  highScore: number;
  average: number | null;
  strikeRate: number | null;
  fifties: number;
  hundreds: number;
  fours: number;
  sixes: number;
  notOuts: number;
  wickets: number;
  bestBowling: { wickets: number; runsConceded: number } | null;
  economy: number | null;
  catches: number;
  runOuts: number;
  stumpings: number;
  motm: number;
  lastRating: number | null;
  ballsFacedTotal: number;
  oversTotal: number;
  runsConcededTotal: number;
};

export type CareerCategory = "RUNS" | "WICKETS" | "CATCHES" | "RATING" | "MOTM";

export function sortCareer(stats: CareerStat[], category: CareerCategory): CareerStat[] {
  const arr = [...stats];
  const by = (key: (s: CareerStat) => number) =>
    arr.sort((a, b) => (key(b) ?? 0) - (key(a) ?? 0));
  switch (category) {
    case "RUNS":
      return by((s) => s.runs);
    case "WICKETS":
      return by((s) => s.wickets);
    case "CATCHES":
      return by((s) => s.catches + s.runOuts + s.stumpings);
    case "RATING":
      return by((s) => s.lastRating ?? 0);
    case "MOTM":
      return by((s) => s.motm);
  }
}