"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectivityStatus = "online" | "offline" | "syncing";

type ConnectivityContextValue = {
  status: ConnectivityStatus;
  pendingCount: number;
  flushQueue: () => Promise<void>;
};

const ConnectivityContext = createContext<ConnectivityContextValue | null>(
  null
);

export function useConnectivity(): ConnectivityContextValue {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) throw new Error("useConnectivity must be used within provider");
  return ctx;
}

const DB_NAME = "yfa-offline";
const STORE = "write-queue";
const CACHE_STORE = "read-cache";

export function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: "url" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function queueOfflineWrite(
  entry: {
    action: string;
    payload: unknown;
    createdAt: number;
  }
): Promise<number> {
  return openOfflineDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const req = tx.objectStore(STORE).add(entry);
        req.onsuccess = () => resolve(req.result as number);
        req.onerror = () => reject(req.error);
      })
  );
}

export function getQueuedWrites(): Promise<
  { id: number; action: string; payload: unknown }[]
> {
  return openOfflineDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result as never[]);
        req.onerror = () => reject(req.error);
      })
  );
}

export function removeQueuedWrite(id: number): Promise<void> {
  return openOfflineDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

export function cacheRead(url: string, data: unknown): Promise<void> {
  return openOfflineDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(CACHE_STORE, "readwrite");
        tx.objectStore(CACHE_STORE).put({ url, data, cachedAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

export async function readCache<T>(url: string): Promise<T | null> {
  try {
    const db = await openOfflineDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(CACHE_STORE, "readonly");
      const req = tx.objectStore(CACHE_STORE).get(url);
      req.onsuccess = () => resolve((req.result?.data as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function flushOfflineQueue(): Promise<number> {
  const entries = await getQueuedWrites();
  let flushed = 0;
  for (const entry of entries) {
    try {
      const res = await fetch("/api/offline/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: entry.action, payload: entry.payload }),
      });
      if (res.ok) {
        await removeQueuedWrite(entry.id);
        flushed++;
      }
    } catch {
      break; // still offline
    }
  }
  return flushed;
}

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectivityStatus>("online");
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = useCallback(async () => {
    try {
      const entries = await getQueuedWrites();
      setPendingCount(entries.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const flushQueue = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.onLine) return;
    setStatus("syncing");
    try {
      const flushed = await flushOfflineQueue();
      await refreshPending();
      if (flushed > 0) {
        window.dispatchEvent(new Event("yfa:synced"));
      }
    } catch {
      /* keep status accurate */
    } finally {
      setStatus("online");
    }
  }, [refreshPending]);

  useEffect(() => {
    const goOnline = () => {
      setStatus("online");
      void flushQueue();
    };
    const goOffline = () => setStatus("offline");
    const onSyncEvent = () => void flushQueue();

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("yfa:sync", onSyncEvent);
    queueMicrotask(() => void refreshPending());

    const interval = window.setInterval(() => {
      if (navigator.onLine) void flushQueue();
    }, 30_000);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("yfa:sync", onSyncEvent);
      window.clearInterval(interval);
    };
  }, [flushQueue, refreshPending]);

  const value = useMemo(
    () => ({ status, pendingCount, flushQueue }),
    [status, pendingCount, flushQueue]
  );

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
      {status !== "online" && (
        <div
          role="status"
          className={cn(
            "fixed bottom-20 left-1/2 z-[90] -translate-x-1/2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-lg md:bottom-6",
            status === "offline"
              ? "border-danger/40 bg-danger/10 text-danger"
              : "border-info/40 bg-info/10 text-info"
          )}
        >
          <span className="flex items-center gap-1.5">
            {status === "offline" ? (
              <>
                <CloudOff className="h-3.5 w-3.5" /> Offline — changes will
                sync when you reconnect
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Syncing
                changes… ({pendingCount})
              </>
            )}
          </span>
        </div>
      )}
    </ConnectivityContext.Provider>
  );
}
