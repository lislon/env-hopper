/**
 * The previous UI's data layer, re-expressed over the current one.
 *
 * The previous UI read `GET /api/config` and `GET /api/customization`. Neither
 * endpoint exists any more: config comes from the `bootstrap` tRPC procedure,
 * and customization is not an API at all — it is a settings object the
 * downstream app supplies. This module is the only place that knows that, so
 * every ported component keeps its original imports-shaped-like-legacy and
 * never learns the current data model.
 *
 * Add a mapping here rather than reaching into `~/modules/*` from a ported file.
 */
import React, { createContext, useContext, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { LOCAL_STORAGE_KEY_VERSION } from '../lib/local-storage-constants'
import { useQueryBootstrapConfig } from '~/api/data/useQueryBootstrapConfig'

/** What the shell used to read off `GET /api/config`. */
export interface LegacyConfig {
  appVersion: string
}

/**
 * Stands in for `useQuery(ApiQueryMagazine.getConfig())`.
 *
 * `appVersion` was a field on the old config payload; `BootstrapConfigData` has
 * no such field, so it comes off the build-time define instead. Everything else
 * the shell used it for is presence: `data === undefined` is what put the old
 * layout into its loading and error branches.
 */
export function useLegacyConfig() {
  const query = useQueryBootstrapConfig()
  const data: LegacyConfig | undefined = query.data
    ? { appVersion: import.meta.env.VITE_APP_VERSION ?? '' }
    : undefined
  return { ...query, data }
}

export interface EhServerSyncContextValue {
  isDegraded: boolean
  error: Error | null
  needRefresh: boolean
  refresh: () => void
}

/**
 * Stands in for the old `EhServerSyncContext`.
 *
 * STUB: `needRefresh` was driven by `virtual:pwa-register/react`. This package
 * does not register a service worker (`registerSW()` is commented out in
 * `appPropsFactory`), so the header's "Update available" button cannot appear
 * yet. Wire this to the real registration when the PWA comes back; the header
 * needs no change when it does.
 *
 * `isDegraded` keeps the original meaning: the query errored but a cached
 * payload is still being served, so the app works offline.
 */
export function useEhServerSync(): EhServerSyncContextValue {
  const { data: config, error } = useLegacyConfig()

  const [, setVersion] = useLocalStorage<string>(LOCAL_STORAGE_KEY_VERSION, '')
  useEffect(() => {
    if (config?.appVersion) {
      setVersion(config.appVersion)
    }
  }, [config?.appVersion, setVersion])

  return {
    error: error ?? null,
    isDegraded: error !== null && config !== undefined,
    needRefresh: false,
    refresh: () => window.location.reload(),
  }
}

/** What the shell used to read off `GET /api/customization`. */
export interface LegacyCustomization {
  /** Raw HTML rendered into the footer by the downstream app. */
  footerHtml: string
}

const EMPTY_CUSTOMIZATION: LegacyCustomization = { footerHtml: '' }

const LegacyCustomizationContext =
  createContext<LegacyCustomization>(EMPTY_CUSTOMIZATION)

/**
 * The seam that replaces `GET /api/customization`. Open source supplies nothing,
 * so the footer renders only what this package owns; a downstream app wraps the
 * tree and fills it in. The full settings API (slots, app links, templates) is
 * a separate piece of work — this carries only what the shell reads.
 */
export function LegacyCustomizationProvider({
  children,
  customization,
}: {
  children: React.ReactNode
  customization?: LegacyCustomization
}) {
  return (
    <LegacyCustomizationContext.Provider
      value={customization ?? EMPTY_CUSTOMIZATION}
    >
      {children}
    </LegacyCustomizationContext.Provider>
  )
}

/** Stands in for `useSuspenseQuery(ApiQueryMagazine.getCustomization())`. */
export function useLegacyCustomization(): LegacyCustomization {
  return useContext(LegacyCustomizationContext)
}
