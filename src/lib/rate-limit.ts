type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return { ok: true, remaining: Math.max(0, limit - 1) }
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  buckets.set(key, existing)
  return { ok: true, remaining: Math.max(0, limit - existing.count) }
}
