// Prompt cache lifetime. 5 for the default API cache, 60 for the 1-hour cache.
export const TTL_MIN = 60
export const WARN_MIN = 5

export const msLeft = (lastAt: number | null, now: number): number | null =>
  lastAt === null ? null : lastAt + TTL_MIN * 60_000 - now

export const minLeft = (ms: number): number => Math.max(0, Math.ceil(ms / 60_000))

export const fmtTokens = (n: number | undefined): string =>
  n === undefined ? '?' : n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : String(n)

export const shouldWarn = (ms: number | null, warnedFor: number | null, lastAt: number | null): boolean =>
  ms !== null && ms > 0 && ms <= WARN_MIN * 60_000 && warnedFor !== lastAt
