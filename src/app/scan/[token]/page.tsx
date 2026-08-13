import { db } from "@/lib/db";
import { ScanResult } from "@/components/scan/scan-result";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ScanTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const exists = await db.student.count({
    where: { qrToken: token, deletedAt: null },
  });

  if (!exists) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-navy px-4 text-center">
        <p className="text-4xl">🔍</p>
        <h1 className="text-xl font-black text-white">Invalid or expired QR code</h1>
        <p className="max-w-sm text-sm text-white/60">
          This code doesn&apos;t match any registered student. Ask the student to use the
          code from their ID card or profile.
        </p>
      </div>
    );
  }

  return (
    <ScanResult
      todayLabel={formatDate(new Date())}
      baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
    />
  );
}