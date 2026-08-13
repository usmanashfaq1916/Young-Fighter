import { QrScanner } from "@/components/scan/qr-scanner";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  await requireRole("ADMIN", "COACH");
  return <QrScanner />;
}