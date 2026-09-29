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
export function migrateStoredAppIds(storage: Storage = localStorage): void {
  rewrite(storage, LOCAL_STORAGE_KEY_FAVORITE_APPS, (value) =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.map((id) => (typeof id === 'string' ? escapeAppId(id) : id)),
          ),
        ]
      : value,
  )
  rewrite(storage, LOCAL_STORAGE_KEY_RECENT_JUMPS, (value) =>
    Array.isArray(value)
      ? value.map((jump) =>
          jump && typeof jump === 'object' && typeof jump.app === 'string'
            ? { ...jump, app: escapeAppId(jump.app) }
            : jump,
        )
      : value,
  )
  rewrite(storage, LOCAL_STORAGE_KEY_LAST_USED_APP, (value) =>
    typeof value === 'string' ? escapeAppId(value) : value,
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
