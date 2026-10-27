/** One thing the page saw, for the diagnostics panel. */
export interface PageEvent {
  at: string
  kind: string
  data: Record<string, unknown>
}

/** The newest events the page keeps for the panel. */
const KEEP = 300
const events: Array<PageEvent> = []
const listeners = new Set<() => void>()

/** Notes what the page saw: a pair answer, a push, an attention change. Cheap; always on. */
export function recordPageEvent(kind: string, data: Record<string, unknown>) {
  events.push({ at: new Date().toISOString(), kind, data })
  if (events.length > KEEP) events.splice(0, events.length - KEEP)
  for (const l of listeners) l()
}

export const pageEvents = (): ReadonlyArray<PageEvent> => events

export function onPageEvent(listener: () => void) {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

const SECRET_KEY =
  /pass|secret|token|cookie|authorization|credential|api[_-]?key|session/i

/**
 * A value fit to paste anywhere: keys that name a secret are dropped, and in
 * strings the user part of URLs, bearer tokens, `key=value` secrets and long
 * token-like runs are replaced.
 */
export function sanitizeForCopy(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^/\s@]+@/gi, '$1<user>@')
      .replace(/\bBearer\s+\S+/gi, 'Bearer <token>')
      .replace(
        /\b(password|passwd|pwd|token|secret|api[_-]?key|cookie)\b(\s*[=:]\s*)\S+/gi,
        '$1$2<redacted>',
      )
      .replace(/\b[A-Za-z0-9_\-+/=]{32,}\b/g, '<token>')
  }
  if (Array.isArray(value)) return value.map(sanitizeForCopy)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !SECRET_KEY.test(k))
        .map(([k, v]) => [k, sanitizeForCopy(v)]),
    )
  }
  return value
}
