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
import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { LOCAL_STORAGE_KEY_VERSION } from '../lib/local-storage-constants'
import { useQueryBootstrapConfig } from '~/api/data/useQueryBootstrapConfig'
import { ApiQueryMagazineResourceJump } from '~/modules/resourceJump/api/ApiQueryMagazineResourceJump'
import { mapToFlagshipResourceJumps } from '~/modules/resourceJump/utils/mapToFlagshipResourceJumps'
import type {
  BootstrapConfigData,
  ResourceJumpsData,
} from '@env-hopper/backend-core'
import type { EhApp, EhClientConfig, EhEnv, EhSubstitutionType } from '../types'

/** What the shell used to read off `GET /api/config`. */
export interface LegacyConfig extends EhClientConfig {
  appVersion: string
}

/**
 * The whole of the previous UI's `/api/config` payload, assembled from the two
 * procedures that replaced it.
 *
 * Where each field comes from, and what is missing:
 *  - `apps` ← one entry per resource jump, titled by the group it belongs to
 *    (`appTitle`) plus its own name (`pageTitle`) — the same two-part title the
 *    previous data carried. `abbr` and `meta` have no source on this branch (the
 *    bootstrap payload keys app metadata separately and carries none yet), so
 *    titles render without an abbreviation and the widget panel has no data.
 *  - `envs` ← the environments the resource-jump payload lists, with the current
 *    `templateParams` standing in for the previous `meta`. `envType` has no
 *    source, so sensitive-value masking is currently always off.
 *  - `substitutions` ← the late-resolvable parameters, which are exactly the
 *    placeholder names a url template can leave behind. Per-parameter behaviour
 *    flags are joined on from the bootstrap contexts when a slug matches.
 */
function mapToLegacyConfig(
  bootstrap: BootstrapConfigData,
  jumps: ResourceJumpsData,
): EhClientConfig {
  const flagships = mapToFlagshipResourceJumps(jumps)

  const apps: Array<EhApp> = jumps.resourceJumps.map((rj) => {
    const flagship = flagships.find((f) =>
      f.resourceJumps.some((r) => r.slug === rj.slug),
    )
    return {
      id: rj.slug,
      urlTemplate: rj.urlTemplate,
      appTitle: flagship?.displayName,
      pageTitle:
        flagship?.displayName === rj.displayName ? undefined : rj.displayName,
    }
  })

  const envs: Array<EhEnv> = jumps.envs.map((env) => ({
    id: env.slug,
    meta: env.templateParams,
    templateParams: env.templateParams,
  }))

  const contextBySlug = new Map(bootstrap.contexts.map((c) => [c.slug, c]))
  const substitutions: Array<EhSubstitutionType> =
    jumps.lateResolvableParams.map((param) => ({
      id: param.slug,
      title: param.displayName,
      isSharedAcrossEnvs: contextBySlug.get(param.slug)?.isSharedAcrossEnvs,
    }))

  return { apps, envs, substitutions }
}

/**
 * Stands in for `useQuery(ApiQueryMagazine.getConfig())`.
 *
 * `appVersion` was a field on the old config payload; `BootstrapConfigData` has
 * no such field, so it comes off the build-time define instead. Everything else
 * the shell used it for is presence: `data === undefined` is what put the old
 * layout into its loading and error branches — and that now also waits for the
 * resource-jump payload, because the form is unusable without it.
 */
export function useLegacyConfig() {
  const query = useQueryBootstrapConfig()
  const jumpsQuery = useQuery(ApiQueryMagazineResourceJump.getResourceJumps())

  const bootstrap = query.data
  const jumps = jumpsQuery.data

  const data: LegacyConfig | undefined = useMemo(
    () =>
      bootstrap && jumps
        ? {
            appVersion: import.meta.env.VITE_APP_VERSION ?? '',
            ...mapToLegacyConfig(bootstrap, jumps),
          }
        : undefined,
    [bootstrap, jumps],
  )

  return {
    ...query,
    error: query.error ?? jumpsQuery.error,
    isError: query.isError || jumpsQuery.isError,
    isLoading: query.isLoading || jumpsQuery.isLoading,
    data,
  }
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
