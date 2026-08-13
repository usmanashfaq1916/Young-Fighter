import "server-only";
import { db } from "@/lib/db";
import type { PushSubscription } from "web-push";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

/**
 * Web Push (VAPID) delivery. Requires NEXT_PUBLIC_VAPID_PUBLIC_KEY and
 * VAPID_PRIVATE_KEY to be configured; otherwise it silently skips browser
 * push and relies on the in-app notification feed.
 */
export async function sendWebPush(userId: string, payload: PushPayload): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  const subs = await db.pushSubscription.findMany({
    where: { userId },
  });
  if (subs.length === 0) return;

  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(
    "mailto:admin@youngfighters.academy",
    publicKey,
    privateKey
  );

  for (const sub of subs) {
    const keys = (sub.keys as { p256dh?: string; auth?: string }) ?? {};
    if (!keys.p256dh || !keys.auth) continue;
    const data: PushSubscription = {
      endpoint: sub.endpoint,
      expirationTime: null,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
    };
    try {
      await webpush.sendNotification(
        data,
        JSON.stringify({ ...payload, icon: "/icon-192.png", badge: "/icon-192.png" })
      );
    } catch (error) {
      const code = (error as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await db.pushSubscription.deleteMany({ where: { id: sub.id } });
      } else {
        console.error("Web push failed:", error);
      }
    }
  }
}