import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'

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
      meta?.trpcClient.usage.record.mutate(input).catch(() => undefined)
    },
    [client],
  )
}

/** Records an `open` each time the page shows another AppEnv. */
export function useRecordOpen(
  appSlug: string | undefined,
  envSlug: string | undefined,
) {
  const record = useRecordUsage()
  useEffect(() => {
    if (appSlug && envSlug) record({ kind: 'open', appSlug, envSlug })
  }, [appSlug, envSlug, record])
}
