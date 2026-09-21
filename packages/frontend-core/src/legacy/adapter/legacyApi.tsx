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
import React, { createContext, use, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { LOCAL_STORAGE_KEY_VERSION } from '../lib/local-storage-constants'
import { useQueryBootstrapConfig } from '~/api/data/useQueryBootstrapConfig'
import { ApiQueryMagazineResourceJump } from '~/modules/resourceJump/api/ApiQueryMagazineResourceJump'
import { mapToFlagshipResourceJumps } from '~/modules/resourceJump/utils/mapToFlagshipResourceJumps'
import { appSlugFromJumpSlug } from '~/util/route-utils'
import type {
  BootstrapConfigData,
  EhBackendAppInput,
  EhBackendDataSourceInputDb,
  ResourceJumpsData,
} from '@env-hopper/backend-core'
import type {
  EhApp,
  EhAppWidgets,
  EhClientConfig,
  EhEnv,
  EhSubstitutionType,
} from '../types'

/**
 * The credential widgets' data, read off the app the jump belongs to.
 *
 * Two things are worth knowing here. First, credentials and data sources hang
 * off the APP, while the previous UI's `EhApp` was one entry per jump page, so
 * every page of an app shows the app's credentials — which is what the previous
 * UI did too, since its payload repeated them per page. The app is found through
 * `appSlugFromJumpSlug`, not through the jump's group: measured over the whole
 * catalogue, the jump slug's own app part resolves for all 111 jumps while the
 * group slug resolves for 106, and the two never disagree.
 *
 * Second, the cast. `BootstrapConfigData.apps` is typed `EhAppIndexed`, which
 * declares neither `ui.credentials` nor `dataSources`, yet a backend fills both
 * in through `EhBackendAppInput` and the controller returns the object it was
 * given, so the fields are on the wire. Narrowing to the input type here says
 * that out loud in the one module allowed to know it.
 * The lasting fix is to declare both on the client-facing type; until then this
 * is the only place that needs to lie.
 */
function mapToLegacyWidgets(
  app: BootstrapConfigData['apps'][string] | undefined,
): EhAppWidgets | undefined {
  const source = app as EhBackendAppInput | undefined
  const credentials = source?.ui?.credentials
  const db = source?.dataSources?.find(
    (ds): ds is EhBackendDataSourceInputDb => ds.type === 'db',
  )

  const ui = credentials?.map((cred) => ({
    label: cred.slug,
    desc: cred.desc,
    username: cred.username,
    password: cred.password,
  }))

  if (!ui?.length && !db) {
    return undefined
  }
  return {
    ui: ui?.length ? ui : undefined,
    db: db && {
      url: db.url,
      username: db.username,
      password: db.password,
    },
  }
}

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
 *    previous data carried. `widgets` is joined on from the bootstrap app the
 *    jump belongs to. `abbr` is on the wire but deliberately not mapped yet:
 *    it feeds the title format every list and quick bar renders, so it is a
 *    change to make on its own. `meta` has no source — no app carries one — so
 *    an `{{app.meta.*}}` placeholder in a widget value stays unresolved and is
 *    shown to the user as it stands.
 *  - `envs` ← the environments the resource-jump payload lists, with the current
 *    `templateParams` standing in for the previous `meta`. `envType` has no
 *    source, so sensitive-value masking is currently always off.
 *  - `substitutions` ← the late-resolvable parameters, which are exactly the
 *    placeholder names a url template can leave behind. Per-parameter behaviour
 *    flags are joined on from the bootstrap contexts when a slug matches.
 */
export function mapToLegacyConfig(
  bootstrap: BootstrapConfigData,
  jumps: ResourceJumpsData,
): EhClientConfig {
  const flagships = mapToFlagshipResourceJumps(jumps)

  const apps: Array<EhApp> = jumps.resourceJumps.map((rj) => {
    const flagship = flagships.find((f) =>
      f.resourceJumps.some((r) => r.slug === rj.slug),
    )
    const bootstrapApp = bootstrap.apps[appSlugFromJumpSlug(rj.slug)]
    return {
      id: rj.slug,
      urlTemplate: rj.urlTemplate,
      appTitle: flagship?.displayName,
      pageTitle:
        flagship?.displayName === rj.displayName ? undefined : rj.displayName,
      widgets: mapToLegacyWidgets(bootstrapApp),
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

  /*
   * The status fields stay the bootstrap query's own, untouched. React Query
   * types them as a discriminated union — `isError: true` is what proves `error`
   * is not null — and merging in a second query's fields collapses that union,
   * which turns the layout's `error.message` into a type error.
   *
   * The cost is narrow and deliberate: a resource-jump failure with a healthy
   * bootstrap shows the layout's "no data available, please refresh" branch
   * rather than the message branch. Both tell the user the same thing, and
   * neither renders the form against half a payload.
   */
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
    <LegacyCustomizationContext value={customization ?? EMPTY_CUSTOMIZATION}>
      {children}
    </LegacyCustomizationContext>
  )
}

/** Stands in for `useSuspenseQuery(ApiQueryMagazine.getCustomization())`. */
export function useLegacyCustomization(): LegacyCustomization {
  return use(LegacyCustomizationContext)
}
