import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { StudentForm } from "@/components/students/student-form";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  await requireRole("ADMIN", "COACH");
  const [batches, todayStr] = await Promise.all([
    db.batch.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    Promise.resolve(new Date().toISOString().slice(0, 10)),
  ]);
  return (
    <StudentForm batches={batches} defaultJoinDate={todayStr} todayStr={todayStr} />
  );
}
