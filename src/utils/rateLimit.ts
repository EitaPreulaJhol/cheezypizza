export const RATE_LIMIT_MAX = 20
export const RATE_LIMIT_WINDOW_MS = 60_000

const attemptsByIp = new Map<string, { count: number; resetAt: number }>()

export function pruneRateLimitEntries(now = Date.now()): void {
  for (const [ip, entry] of attemptsByIp.entries()) {
    if (now > entry.resetAt) {
      attemptsByIp.delete(ip)
    }
  }
}

export function normalizeClientIp(ipHeader: string | null | undefined): string {
  const candidate = ipHeader?.split(',')[0]?.trim()
  return candidate && candidate !== 'unknown' ? candidate : 'unknown'
}

export function isRateLimited(ip: string): boolean {
  const normalizedIp = normalizeClientIp(ip)
  const now = Date.now()
  pruneRateLimitEntries(now)

  const entry = attemptsByIp.get(normalizedIp)
  if (!entry) {
    attemptsByIp.set(normalizedIp, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    })
    return false
  }

  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}
