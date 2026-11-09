import {
  resolveTemplate,
  substituteTemplate,
  substituteTemplateWithEnvParams,
} from '@env-hopper/shared-core'
import type {
  BootstrapConfigData,
  EhAppFacility,
  EhBackendAppInput,
  EhBackendCredentialInput,
  EhBackendDataSourceInputDb,
  EhMetaDictionary,
  LateResolvableParam,
  ResourceJump,
  ResourceJumpsData,
} from '@env-hopper/backend-core'

export interface McpEnv {
  slug: string
  name: string
  envType?: string
  unavailable: ReadonlySet<EhAppFacility>
  /** Every value a template may name on this env, `env.meta.x` style. */
  params: Record<string, string>
  appMeta: Record<string, string>
}

export interface McpApp {
  slug: string
  name: string
  aliases: Array<string>
  meta: Record<string, string>
  credentials: Array<EhBackendCredentialInput>
  databases: Array<EhBackendDataSourceInputDb>
}

export interface McpJump {
  slug: string
  appSlug: string
  name: string
  aliases: Array<string>
  params: Array<string>
  urlTemplate: ResourceJump['urlTemplate']
}

/** One read of the deployment's data, in the shape the tools look things up in. */
export interface McpData {
  envs: Array<McpEnv>
  apps: Array<McpApp>
  jumps: Array<McpJump>
  params: Array<LateResolvableParam>
  /** Where a person asks for their own access; a template like the access card's. */
  accessRequestUrl?: string
  /** The Env Hopper UI's own origin. */
  ehBaseUrl: string
}

function strings(meta: EhMetaDictionary | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(meta ?? {}).filter(
      (e): e is [string, string] => typeof e[1] === 'string',
    ),
  )
}

function prefixed(
  prefix: string,
  values: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => [`${prefix}${k}`, v]),
  )
}

/** The part of a jump slug before `@`: `orders@shipments` belongs to `orders`. */
export function appSlugOfJump(jumpSlug: string): string {
  return jumpSlug.split('@')[0]!
}

export function toMcpData(
  bootstrap: BootstrapConfigData,
  jumpsData: ResourceJumpsData,
  ehBaseUrl: string,
): McpData {
  const jumpEnvParams = new Map(
    jumpsData.envs.map((e) => [e.slug, e.templateParams ?? {}]),
  )
  const envs = Object.values(bootstrap.envs).map((e) => ({
    slug: e.slug,
    name: e.displayName,
    envType: e.envType,
    unavailable: new Set(e.appOverride?.unavailable),
    params: {
      ...prefixed('env.meta.', strings(e.meta)),
      ...jumpEnvParams.get(e.slug),
      'env.id': e.slug,
      'env.slug': e.slug,
      'env.displayName': e.displayName,
    },
    appMeta: strings(e.appOverride?.meta),
  }))

  // An abbreviation several apps share names their group, not one app.
  const abbrCount = new Map<string, number>()
  for (const a of Object.values(bootstrap.apps)) {
    if (a.abbr) abbrCount.set(a.abbr, (abbrCount.get(a.abbr) ?? 0) + 1)
  }

  const apps = Object.values(bootstrap.apps).map((indexed) => {
    // The backend's input type is what is on the wire: see the UI's legacy adapter.
    const a = indexed as EhBackendAppInput
    return {
      slug: a.slug,
      name: a.displayName,
      aliases: [
        ...(a.aliases ?? []).filter(Boolean),
        ...(a.abbr && abbrCount.get(a.abbr) === 1 ? [a.abbr] : []),
      ],
      meta: strings(a.meta),
      credentials: a.ui?.credentials ?? [],
      databases: (a.dataSources ?? []).filter(
        (d): d is EhBackendDataSourceInputDb => d.type === 'db',
      ),
    }
  })

  const jumps = jumpsData.resourceJumps.map((j) => ({
    slug: j.slug,
    appSlug: appSlugOfJump(j.slug),
    name: j.displayName,
    aliases: j.aliases ?? [],
    params: j.lateResolvableParamSlugs ?? [],
    urlTemplate: j.urlTemplate,
  }))

  return {
    envs,
    apps,
    jumps,
    params: jumpsData.lateResolvableParams,
    accessRequestUrl: bootstrap.customization?.accessRequestCard?.urlDecoded,
    ehBaseUrl: ehBaseUrl.replace(/\/+$/, ''),
  }
}

const unresolved = (s: string) => s.includes('{{')

/**
 * A credential, database url or access link as the UI shows it on this env:
 * the app's meta with the env's override on top, then the env's values.
 */
export function renderForApp(
  template: string,
  app: McpApp,
  env: McpEnv,
): string {
  return substituteTemplate(template, {
    ...env.params,
    ...prefixed('app.meta.', { ...app.meta, ...env.appMeta }),
    'app.slug': app.slug,
    'app.displayName': app.name,
  })
}

/** A jump's url on an env, the way the UI builds it; undefined while a placeholder is left. */
export function renderJump(
  jump: McpJump,
  env: McpEnv,
  app: McpApp | undefined,
  values: Record<string, string>,
): string | undefined {
  const url = substituteTemplateWithEnvParams(
    resolveTemplate(env.slug, jump.urlTemplate),
    env.slug,
    env.params,
    jump.urlTemplate.templateParams,
    values,
    app && {
      'app.slug': app.slug,
      'app.displayName': app.name,
      ...prefixed('app.meta.', app.meta),
    },
  )
  return unresolved(url) ? undefined : url
}

export function isResolved(s: string | undefined): s is string {
  return s !== undefined && !unresolved(s)
}
