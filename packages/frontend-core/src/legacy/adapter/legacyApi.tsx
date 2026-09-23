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
  EhCustomizationData,
  EhEnvAppOverride,
  EhMetaDictionary,
  ResourceJumpsData,
} from '@env-hopper/backend-core'
import type {
  EhApp,
  EhAppOverride,
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

/**
 * The app's template variables, flattened to the shape the widget interpolator
 * reads.
 *
 * `{{app.meta.x}}` substitutes one string, so only string entries can be used:
 * the current dictionary also allows `null` and a nested object, and neither has
 * a placeholder syntax that could name it. Dropping them here is what keeps
 * every consumer working with a plain `Record<string, string>`.
 */
function mapToLegacyMeta(
  meta: EhMetaDictionary | undefined,
): Record<string, string> | undefined {
  if (!meta) {
    return undefined
  }
  const entries = Object.entries(meta).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  )
  return entries.length ? Object.fromEntries(entries) : undefined
}

/**
 * An environment's app override, in the shape the widgets merge.
 *
 * `unavailable` becomes an explicit `null` per widget, which is what the merge
 * reads: a key that is present and null removes the app's own value, whereas an
 * absent key leaves it alone.
 */
function mapToLegacyAppOverride(
  override: EhEnvAppOverride | undefined,
): EhAppOverride | undefined {
  if (!override) {
    return undefined
  }
  const unavailable = new Set(override.unavailable)
  return {
    meta: mapToLegacyMeta(override.meta),
    widgets: {
      ...(unavailable.has('credentials') ? { ui: null } : {}),
      ...(unavailable.has('dataSources') ? { db: null } : {}),
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
 *    jump belongs to, and so is `abbr`, the group prefix every title carries
 *    (`GRP :: App :: Page`); without it every list, quick bar
 *    and page title lost its first segment. `meta` is mapped from the bootstrap app, which
 *    is what lets an `{{app.meta.*}}` placeholder in a widget value resolve;
 *    before the backend shipped that field the placeholder was shown raw.
 *  - `envs` ← the environments the resource-jump payload lists, with the current
 *    `templateParams` standing in for the previous `meta`. Two fields are joined
 *    on from the bootstrap entry for the same slug, because only that payload
 *    has them: `envType`, which gates sensitive-value masking, and
 *    `appOverride`, which restates the app's values for this environment.
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
      abbr: bootstrapApp?.abbr,
      appTitle: flagship?.displayName,
      pageTitle:
        flagship?.displayName === rj.displayName ? undefined : rj.displayName,
      widgets: mapToLegacyWidgets(bootstrapApp),
      // Carries the app-level template variables a widget value references —
      // `{{app.meta.*}}`. The values are themselves templates naming env-level
      // values, so resolving one is a multi-level walk, which is why the
      // resolver's depth cap matters here.
      meta: mapToLegacyMeta(bootstrapApp?.meta),
    }
  })

  const envs: Array<EhEnv> = jumps.envs.map((env) => {
    // The resource-jump payload carries the environment's own parameters; its
    // kind and its app override are on the bootstrap entry for the same slug.
    const indexed = bootstrap.envs[env.slug]
    return {
      id: env.slug,
      meta: env.templateParams,
      templateParams: env.templateParams,
      envType: indexed?.envType,
      appOverride: mapToLegacyAppOverride(indexed?.appOverride),
    }
  })

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
 * `appVersion` comes off the bootstrap payload, as it came off the old config
 * payload — the server's version, not the bundle's. Everything else the shell
 * used this for is presence: `data === undefined` is what put the old layout
 * into its loading and error branches — and that now also waits for the
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
            appVersion: bootstrap.appVersion ?? '',
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
 * `needRefresh` is a constant `false`, and that is PARITY, not a gap. It used to
 * be driven by `virtual:pwa-register/react`, but the plugin only wires
 * `onNeedRefresh` in its `prompt` branch (`client/build/register.js`: under
 * `autoUpdate` the `activated` listener reloads the page instead, and the
 * `waiting` listener that calls `onNeedRefresh` is never registered). Deployments
 * ship `autoUpdate` — including this one, deliberately, because a waiting worker
 * would never take over from the previous generation's — so the header's "Update
 * available, click to reload" button never appeared in production either.
 *
 * So do not "restore" this by wiring it to the registration: on an `autoUpdate`
 * build there is nothing to wire, and the button would only ever be reachable by
 * switching the whole deployment to `prompt`, which is the thing that strands
 * users on an old bundle. The page reloads itself instead.
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

/**
 * What the shell used to read off `GET /api/customization`.
 *
 * `footerHtml` is required here and optional on the wire, so every consumer can
 * render it without a guard.
 */
export interface LegacyCustomization extends EhCustomizationData {
  footerHtml: string
}

const EMPTY_CUSTOMIZATION: LegacyCustomization = { footerHtml: '' }

const LegacyCustomizationContext = createContext<
  LegacyCustomization | undefined
>(undefined)

/**
 * Overrides what the backend serves as `bootstrap.customization`.
 *
 * Nothing has to wrap the tree: the backend is the normal source. This exists
 * for a downstream app that wants to change the presentation without a backend
 * change — and for tests, which is the only caller today.
 */
export function LegacyCustomizationProvider({
  children,
  customization,
}: {
  children: React.ReactNode
  customization?: LegacyCustomization
}) {
  return (
    <LegacyCustomizationContext value={customization}>
      {children}
    </LegacyCustomizationContext>
  )
}

/**
 * Stands in for `useSuspenseQuery(ApiQueryMagazine.getCustomization())`.
 *
 * Not suspending is the one behavioural difference. The previous UI blocked the
 * whole page on this payload; it now arrives with `bootstrap`, which the shell
 * already waits for, so the first render either has it or the deployment has
 * none. A consumer that renders a list gets an empty list for one frame instead
 * of a suspense boundary.
 */
export function useLegacyCustomization(): LegacyCustomization {
  const override = use(LegacyCustomizationContext)
  const { data } = useQueryBootstrapConfig()

  return useMemo(() => {
    if (override) {
      return override
    }
    const served = data?.customization
    return served ? { footerHtml: '', ...served } : EMPTY_CUSTOMIZATION
  }, [override, data?.customization])
}
