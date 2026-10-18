import { escapeAppId } from '~/util/route-utils'
import {
  LOCAL_STORAGE_KEY_FAVORITE_APPS,
  LOCAL_STORAGE_KEY_LAST_USED_APP,
  LOCAL_STORAGE_KEY_RECENT_JUMPS,
} from './local-storage-constants'

/**
 * Rewrites app ids a returning user of the previous UI has stored into the ids
 * this app uses.
 *
 * The previous UI identified a page of a multi-page app as `<app>/<page>` —
 * `orders/shipments`, `orders/home` — and stored that in favourites, history and
 * the last-used app. This app identifies it as the url spelling, `escapeAppId`:
 * `/home` dropped, any other `/` written `@`. So a stored `orders/shipments`
 * matched no app: the favourite star showed empty, the quick bars showed nothing,
 * and the history rows lost their jump buttons. The data was kept and silently
 * unused — and every multi-page app a user had ever favourited or opened was
 * affected. Single-page app ids have no `/`, which is why a check using one of
 * those passed.
 *
 * Rewriting the stored values once, rather than translating at every lookup,
 * keeps one id form in play: a lookup-only fix would still leave the star
 * comparing against the old form, and toggling it would store a duplicate.
 *
 * Idempotent — `escapeAppId` leaves an id already in this form unchanged — so it
 * is safe to run on every load. A value that does not parse is left alone.
 */
export function migrateStoredAppIds(
  storage: Storage = localStorage,
  /** Old app id -> its new one, for apps the backend renamed. */
  renamed: Record<string, string> = {},
): void {
  const migrate = (id: string) => {
    const escaped = escapeAppId(id)
    return renamed[escaped] ?? escaped
  }
  rewrite(storage, LOCAL_STORAGE_KEY_FAVORITE_APPS, (value) =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.map((id) => (typeof id === 'string' ? migrate(id) : id)),
          ),
        ]
      : value,
  )
  rewrite(storage, LOCAL_STORAGE_KEY_RECENT_JUMPS, (value) =>
    Array.isArray(value)
      ? value.map((jump) =>
          jump && typeof jump === 'object' && typeof jump.app === 'string'
            ? { ...jump, app: migrate(jump.app) }
            : jump,
        )
      : value,
  )
  rewrite(storage, LOCAL_STORAGE_KEY_LAST_USED_APP, (value) =>
    typeof value === 'string' ? migrate(value) : value,
  )
}

/**
 * The stored app ids no current app has that the backend knows a new name
 * for (`findRename`), old id -> new id. Each such id is asked once.
 */
export async function findRenamedAppIds(
  storage: Storage,
  known: Set<string>,
  findRename: (id: string) => Promise<string | undefined>,
): Promise<Record<string, string>> {
  const read = (key: string): unknown => {
    try {
      return JSON.parse(storage.getItem(key) ?? 'null')
    } catch {
      return null
    }
  }
  const favourites = read(LOCAL_STORAGE_KEY_FAVORITE_APPS)
  const recent = read(LOCAL_STORAGE_KEY_RECENT_JUMPS)
  const stored = [
    ...(Array.isArray(favourites) ? favourites : []),
    ...(Array.isArray(recent)
      ? recent.map((j: { app?: unknown } | null) => j?.app)
      : []),
    read(LOCAL_STORAGE_KEY_LAST_USED_APP),
  ]
  const unknown = [
    ...new Set(stored.filter((id): id is string => typeof id === 'string')),
  ].filter((id) => !known.has(id))
  const found = await Promise.all(
    unknown.map(async (id) => [id, await findRename(id)] as const),
  )
  return Object.fromEntries(
    found.filter((f): f is readonly [string, string] => !!f[1]),
  )
}

function rewrite(
  storage: Storage,
  key: string,
  migrate: (value: any) => unknown,
): void {
  try {
    const raw = storage.getItem(key)
    if (raw === null) {
      return
    }
    const next = JSON.stringify(migrate(JSON.parse(raw)))
    if (next !== raw) {
      storage.setItem(key, next)
    }
  } catch {
    // Unparseable or unavailable storage: leave the value exactly as it was.
  }
}
