import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { LOCAL_STORAGE_KEY_USER_ID } from '~/legacy/lib/local-storage-constants'

/** The id the previous UI kept for this browser; the backend adopts it on the first record. */
function legacyUserId(): string | undefined {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY_USER_ID) ?? undefined
  } catch {
    return undefined
  }
}

interface UsageInput {
  kind: 'open' | 'jump'
  appSlug: string
  envSlug: string
  resourceJump?: string
  url?: string
}

/**
 * Tells the backend what the User does (ADR 0006): it keeps it, and reads
 * again what the AppEnv shows. Fire and forget: it never gets in the way.
 */
export function useRecordUsage() {
  const client = useQueryClient()
  return useCallback(
    (input: UsageInput) => {
      const meta = client.getDefaultOptions().mutations?.meta
      const legacy = legacyUserId()
      meta?.trpcClient.usage.record
        .mutate({ ...input, ...(legacy && { legacyUserId: legacy }) })
        .catch(() => undefined)
    },
    [client],
  )
}

/** The AppEnv last recorded as opened: a re-render or a remount is no new `open`. */
let lastOpen = ''

/** Records an `open` each time the page shows another AppEnv. */
export function useRecordOpen(
  appSlug: string | undefined,
  envSlug: string | undefined,
) {
  const record = useRecordUsage()
  useEffect(() => {
    if (!appSlug || !envSlug || lastOpen === `${appSlug}/${envSlug}`) return
    lastOpen = `${appSlug}/${envSlug}`
    record({ kind: 'open', appSlug, envSlug })
  }, [appSlug, envSlug, record])
}
