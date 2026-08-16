import { headers } from "next/headers";

const store = new Map<string, number[]>();

/**
 * In-memory sliding-window rate limiter. Returns true when the call is
 * allowed, false when the key has exceeded `max` hits within `windowMs`.
 * Process-local by design — sufficient for per-instance abuse protection.
 */
export function rateLimit(
  key: string,
  opts: { max?: number; windowMs?: number } = {}
): boolean {
  const max = opts.max ?? Number(process.env.AUTH_RATE_LIMIT_MAX ?? 10);
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (store.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= max) return false;
  hits.push(now);
  store.set(key, hits);
  return true;
}

export async function clientKey(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "local"
  );
}
