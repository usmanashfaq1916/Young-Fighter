import { redirect } from "next/navigation";
import { verifySession, dashboardPathFor } from "@/lib/auth";

export default async function HomePage() {
  const user = await verifySession();
  if (!user) redirect("/login");
  redirect(dashboardPathFor(user.role));
}
