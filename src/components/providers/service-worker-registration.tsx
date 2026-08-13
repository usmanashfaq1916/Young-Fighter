"use client";

import { useEffect } from "react";

async function subscribeToPush(registration: ServiceWorkerRegistration) {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;
    if (!("PushManager" in window)) return;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    const sub = subscription.toJSON();
    await fetch("/api/push-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: sub.keys,
      }),
    });
  } catch {
    /* Push setup is best-effort */
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          void subscribeToPush(registration);
        })
        .catch(() => {
          /* SW registration is best-effort */
        });
    }
  }, []);

  return null;
}