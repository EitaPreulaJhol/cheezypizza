import { describe, expect, it, vi } from 'vitest'
import { isRateLimited, normalizeClientIp, pruneRateLimitEntries } from '../../src/utils/rateLimit'

describe('destroy route rate limiting', () => {
    it('normalizes forwarded-for headers and unknown values', () => {
        expect(normalizeClientIp('203.0.113.5, 10.0.0.1')).toBe('203.0.113.5')
        expect(normalizeClientIp(null)).toBe('unknown')
        expect(normalizeClientIp('unknown')).toBe('unknown')
    })

    it('allows the first few requests and blocks the next one once the threshold is reached', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))

        expect(isRateLimited('203.0.113.10')).toBe(false)
        for (let i = 0; i < 19; i += 1) {
            expect(isRateLimited('203.0.113.10')).toBe(false)
        }
        expect(isRateLimited('203.0.113.10')).toBe(true)

        vi.useRealTimers()
    })

    it('removes expired entries when the window has elapsed', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))

        expect(isRateLimited('203.0.113.11')).toBe(false)

        vi.setSystemTime(new Date('2024-01-01T00:01:01Z'))
        pruneRateLimitEntries(Date.now())
        expect(isRateLimited('203.0.113.11')).toBe(false)

        vi.useRealTimers()
    })
})
