import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assertStudentAccess } from "@/lib/rbac";
import { StudentForm } from "@/components/students/student-form";

export const dynamic = "force-dynamic";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("ADMIN", "COACH");
  const { id } = await params;

  if (!(await assertStudentAccess(user, id))) notFound();

  const [student, batches] = await Promise.all([
    db.student.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        guardianName: true,
        mobile: true,
        whatsapp: true,
        dob: true,
        gender: true,
        address: true,
        joinDate: true,
        batchId: true,
        skillLevel: true,
        monthlyFee: true,
        emergencyContact: true,
        bloodGroup: true,
        status: true,
        photoUrl: true,
      },
    }),
    db.batch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!student) notFound();

  return (
    <StudentForm
      student={{
        id: student.id,
        studentId: student.studentId,
        fullName: student.fullName,
        guardianName: student.guardianName,
        mobile: student.mobile,
        whatsapp: student.whatsapp ?? "",
        dob: student.dob.toISOString().slice(0, 10),
        gender: student.gender,
        address: student.address ?? "",
        joinDate: student.joinDate.toISOString().slice(0, 10),
        batchId: student.batchId ?? "",
        skillLevel: student.skillLevel,
        monthlyFee: student.monthlyFee,
        emergencyContact: student.emergencyContact ?? "",
        bloodGroup: student.bloodGroup ?? "",
        status: student.status,
        photoUrl: student.photoUrl,
      }}
      batches={batches}
    />
  );
}
