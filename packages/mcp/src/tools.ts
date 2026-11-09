import {
  fuzzySearch,
  makeFuzzySearchIndex,
  pickMatch,
} from '@env-hopper/shared-core'
import type { MatchCandidate, MatchOption } from '@env-hopper/shared-core'
import type { Catalog } from '@env-hopper/backend-core'
import { isResolved, renderForApp, renderJump } from './mcpData'
import type { McpApp, McpData, McpEnv, McpJump } from './mcpData'

/** What a lookup tool says back; the same shape for get_url, get_login, get_database_access. */
export interface McpResult {
  env?: string | null
  app?: string | null
  jump?: string | null
  params?: Record<string, string | null>
  url?: string
  ehUrl?: string
  missingParams?: Array<string>
  homeUrl?: string
  unusedParams?: Array<string>
  logins?: Array<{
    label: string
    desc?: string
    username: string
    password: string
  }>
  databases?: Array<{
    url: string
    host?: string
    port?: number
    database?: string
    username: string
    password: string
  }>
  requestAccess?: { url: string }
  options?: {
    env?: Array<MatchOption>
    app?: Array<MatchOption>
    jump?: Array<MatchOption>
    params?: Record<string, Array<MatchOption>>
  }
}

const MAX_JUMP_OPTIONS = 10

function envCandidates(d: McpData): Array<MatchCandidate> {
  return d.envs.map((e) => ({ slug: e.slug, name: e.name }))
}

function appCandidates(d: McpData): Array<MatchCandidate> {
  return d.apps.map((a) => ({ slug: a.slug, name: a.name, aliases: a.aliases }))
}

function appOf(d: McpData, slug: string): McpApp | undefined {
  return d.apps.find((a) => a.slug === slug)
}

/** "App · Jump", or the app's name alone for its one page named after it. */
function crossAppName(d: McpData, j: McpJump): string {
  const appName = appOf(d, j.appSlug)?.name ?? j.appSlug
  return j.name === appName ? appName : `${appName} · ${j.name}`
}

function jumpCandidates(
  d: McpData,
  jumps: Array<McpJump>,
  withinApp: boolean,
): Array<MatchCandidate> {
  return jumps.map((j) => ({
    slug: j.slug,
    name: withinApp ? j.name : crossAppName(d, j),
    aliases: [...j.aliases, j.slug.split('@')[1] ?? 'home'],
  }))
}

function jumpsOf(d: McpData, appSlug: string): Array<McpJump> {
  return d.jumps.filter((j) => j.appSlug === appSlug)
}

/** The app's own home page: the jump named after the app, else its first. */
function homeJump(d: McpData, appSlug: string): McpJump | undefined {
  const own = jumpsOf(d, appSlug)
  return own.find((j) => j.slug === appSlug) ?? own[0]
}

/** Options as an agent passes them back: a cross-app jump is named "App · Jump". */
function jumpOptions(d: McpData, jumps: Array<McpJump>): Array<MatchOption> {
  return jumps
    .slice(0, MAX_JUMP_OPTIONS)
    .map((j) => ({ slug: j.slug, name: crossAppName(d, j) }))
}

export function ehUrlFor(
  d: McpData,
  env: string | undefined,
  jump: McpJump | undefined,
  values: Record<string, string>,
): string {
  const parts: Array<string> = []
  if (env) parts.push('env', encodeURIComponent(env))
  if (jump) {
    // `@` is part of the UI's url vocabulary and stays as it is.
    parts.push('app', jump.slug)
    const sub = jump.params[0] && values[jump.params[0]]
    if (sub !== undefined && sub !== '')
      parts.push('sub', encodeURIComponent(sub))
  }
  return `${d.ehBaseUrl}/${parts.join('/')}`
}

function setOptions(
  out: McpResult,
  field: 'env' | 'app' | 'jump',
  options: Array<MatchOption>,
) {
  if (options.length) out.options = { ...out.options, [field]: options }
}

function resolveEnv(d: McpData, out: McpResult, query: string) {
  const m = pickMatch(query, envCandidates(d))
  out.env = m.picked
  setOptions(out, 'env', m.options)
  return d.envs.find((e) => e.slug === m.picked)
}

function resolveApp(
  d: McpData,
  out: McpResult,
  query: string,
  prefer?: (slug: string) => boolean,
) {
  const m = pickMatch(query, appCandidates(d), { prefer })
  out.app = m.picked
  setOptions(out, 'app', m.options)
  return m.picked ? appOf(d, m.picked) : undefined
}

export interface GetUrlArgs {
  env?: string
  app?: string
  jump?: string
  params?: Record<string, string>
}

export function getUrl(d: McpData, args: GetUrlArgs): McpResult {
  const out: McpResult = {}
  const env = args.env !== undefined ? resolveEnv(d, out, args.env) : undefined

  // Each key echoed under the param it names.
  const values: Record<string, string> = {}
  if (args.params) {
    out.params = {}
    const paramOptions: Record<string, Array<MatchOption>> = {}
    for (const [key, value] of Object.entries(args.params)) {
      const m = pickMatch(
        key,
        d.params.map((p) => ({
          slug: p.slug,
          name: p.displayName,
          aliases: p.aliases,
        })),
      )
      if (m.picked) {
        out.params[m.picked] = value
        values[m.picked] = value
      } else {
        out.params[key] = null
      }
      if (m.options.length) paramOptions[key] = m.options
    }
    if (Object.keys(paramOptions).length) {
      out.options = { ...out.options, params: paramOptions }
    }
  }
  const given = Object.keys(values)
  const takenCount = (j: McpJump) =>
    given.filter((k) => j.params.includes(k)).length

  const app =
    args.app !== undefined
      ? resolveApp(d, out, args.app, (slug) =>
          jumpsOf(d, slug).some((j) => takenCount(j) > 0),
        )
      : undefined

  // An app that matched nothing leaves nothing to look the jump up in.
  let jump: McpJump | undefined
  if (out.app !== null) {
    const pool = app ? jumpsOf(d, app.slug) : d.jumps
    if (args.jump !== undefined) {
      const m = pickMatch(args.jump, jumpCandidates(d, pool, !!app), {
        prefer: (slug) => takenCount(pool.find((j) => j.slug === slug)!) > 0,
      })
      jump = pool.find((j) => j.slug === m.picked)
      out.jump = m.picked
      const optionJumps = m.options.map(
        (o) => pool.find((j) => j.slug === o.slug)!,
      )
      const taking = optionJumps.filter((j) => takenCount(j) > 0)
      setOptions(
        out,
        'jump',
        jumpOptions(d, given.length && taking.length ? taking : optionJumps),
      )
    } else if (given.length) {
      const best = Math.max(0, ...pool.map(takenCount))
      const taking = best > 0 ? pool.filter((j) => takenCount(j) === best) : []
      const defaults = given.map(
        (k) => d.params.find((p) => p.slug === k)?.defaultJump,
      )
      if (taking.length === 1) {
        jump = taking[0]
      } else if (taking.length > 1) {
        jump = taking.find((j) => defaults.includes(j.slug))
        if (!jump) {
          out.jump = null
          setOptions(out, 'jump', jumpOptions(d, taking))
        }
      } else if (app) {
        jump = homeJump(d, app.slug)
      }
    } else if (app) {
      jump = homeJump(d, app.slug)
    }
  }
  if (jump) out.jump = jump.slug

  if (jump) {
    const unused = given.filter((k) => !jump.params.includes(k))
    if (unused.length) out.unusedParams = unused
  }

  const nothingNull =
    out.env !== null &&
    out.app !== null &&
    out.jump !== null &&
    Object.values(out.params ?? {}).every((v) => v !== null)
  if (nothingNull) {
    const missing = jump?.params.filter((p) => !(p in values)) ?? []
    const jumpApp = jump && appOf(d, jump.appSlug)
    if (env && jump && !missing.length) {
      const url = renderJump(jump, env, jumpApp, pick(values, jump.params))
      if (url) out.url = url
    }
    out.ehUrl = ehUrlFor(d, env?.slug, jump, values)
    if (missing.length) {
      out.missingParams = missing
      const home = jump && homeJump(d, jump.appSlug)
      const homeUrl =
        env && home && !home.params.length
          ? renderJump(home, env, jumpApp, {})
          : undefined
      if (homeUrl) out.homeUrl = homeUrl
    }
  }
  return reorder(out)
}

function pick(values: Record<string, string>, keys: Array<string>) {
  return Object.fromEntries(
    keys.filter((k) => k in values).map((k) => [k, values[k]!]),
  )
}

const FIRST = ['url', 'ehUrl', 'env', 'app', 'jump', 'params'] as const

/** Links first, then the echo, options last: what an agent reads first is what it uses. */
function reorder(out: McpResult): McpResult {
  const { options, ...rest } = out
  const first = FIRST.filter((k) => k in rest).map((k) => [k, rest[k]])
  return {
    ...Object.fromEntries(first),
    ...rest,
    ...(options ? { options } : {}),
  }
}

/** The env shares no login or database: where to ask for one's own. */
function requestAccess(d: McpData, app: McpApp, env: McpEnv) {
  if (!d.accessRequestUrl) return undefined
  const url = renderForApp(d.accessRequestUrl, app, env)
  return isResolved(url) ? { url } : undefined
}

function resolvePair(d: McpData, args: { app: string; env: string }) {
  const out: McpResult = {}
  const env = resolveEnv(d, out, args.env)
  const app = resolveApp(d, out, args.app)
  return { out, env, app }
}

export function getLogin(
  d: McpData,
  args: { app: string; env: string },
): McpResult {
  const { out, env, app } = resolvePair(d, args)
  if (!env || !app) return reorder(out)
  const access = env.unavailable.has('credentials')
    ? requestAccess(d, app, env)
    : undefined
  if (access) return reorder({ ...out, requestAccess: access })
  out.logins = env.unavailable.has('credentials')
    ? []
    : app.credentials.map((c) => ({
        label: c.slug,
        ...(c.desc ? { desc: c.desc } : {}),
        username: renderForApp(c.username, app, env),
        password: renderForApp(c.password, app, env),
      }))
  return reorder(out)
}

/** `jdbc:mysql://host:3306/db?x=y` into its parts; unknown parts left out. */
export function parseJdbc(url: string) {
  const m = /^jdbc:[\w:]+?:\/\/([^:/?;]+)(?::(\d+))?(?:\/([^?;]*))?/.exec(url)
  if (!m) return {}
  return {
    host: m[1],
    ...(m[2] ? { port: Number(m[2]) } : {}),
    ...(m[3] ? { database: m[3] } : {}),
  }
}

export function getDatabaseAccess(
  d: McpData,
  args: { app: string; env: string },
): McpResult {
  const { out, env, app } = resolvePair(d, args)
  if (!env || !app) return reorder(out)
  const access = env.unavailable.has('dataSources')
    ? requestAccess(d, app, env)
    : undefined
  if (access) return reorder({ ...out, requestAccess: access })
  out.databases = env.unavailable.has('dataSources')
    ? []
    : app.databases.map((db) => {
        const url = renderForApp(db.url, app, env)
        return {
          url,
          ...parseJdbc(url),
          username: renderForApp(db.username, app, env),
          password: renderForApp(db.password, app, env),
        }
      })
  return reorder(out)
}

/** Every candidate the words match, not only the best: for list filters. */
function matchingSlugs(query: string, candidates: Array<MatchCandidate>) {
  const glue = (s: string) => s.toLowerCase().replaceAll(/[^\p{L}\p{N}]/gu, '')
  const q = glue(query)
  const exact = candidates
    .filter((c) =>
      [c.slug, c.name, ...(c.aliases ?? [])].some((t) => glue(t) === q),
    )
    .map((c) => c.slug)
  const index = makeFuzzySearchIndex({
    entries: candidates.map((c) => ({ slug: c.slug, displayName: c.name })),
  })
  // Below 2 is a scattered-letters match: noise in a list.
  const fuzzy = fuzzySearch(query, { index })
    .filter((r) => r.rank >= 2)
    .map((r) => r.entry.slug)
  return new Set([...exact, ...fuzzy])
}

export function listApps(d: McpData, args: { query?: string }) {
  let apps = d.apps
  if (args.query) {
    const q = args.query
    const appHits = matchingSlugs(q, appCandidates(d))
    const jumpHits = matchingSlugs(q, jumpCandidates(d, d.jumps, false))
    const paramHits = matchingSlugs(
      q,
      d.params.map((p) => ({
        slug: p.slug,
        name: p.displayName,
        aliases: p.aliases,
      })),
    )
    apps = apps.filter(
      (a) =>
        appHits.has(a.slug) ||
        jumpsOf(d, a.slug).some(
          (j) => jumpHits.has(j.slug) || j.params.some((p) => paramHits.has(p)),
        ),
    )
  }
  return {
    apps: apps.map((a) => ({
      slug: a.slug,
      name: a.name,
      ...(a.aliases.length ? { aliases: a.aliases } : {}),
      jumps: jumpsOf(d, a.slug).map((j) => ({
        slug: j.slug,
        name: j.name,
        ...(j.params.length ? { params: j.params } : {}),
      })),
      ...(a.credentials.length ? { login: true } : {}),
      ...(a.databases.length ? { database: true } : {}),
    })),
  }
}

function credentialsKind(env: McpEnv) {
  return env.unavailable.has('credentials') ? 'requestAccess' : 'shared'
}

export async function listEnvs(
  d: McpData,
  catalog: Catalog | null,
  args: { query?: string; app?: string },
) {
  const envHits = args.query
    ? matchingSlugs(args.query, envCandidates(d))
    : undefined
  const envs = d.envs.filter((e) => !envHits || envHits.has(e.slug))
  if (args.app === undefined) {
    return {
      envs: envs.map((e) => ({
        slug: e.slug,
        ...(e.name !== e.slug ? { name: e.name } : {}),
        ...(e.envType ? { type: e.envType } : {}),
        credentials: credentialsKind(e),
      })),
    }
  }

  const out: McpResult = {}
  const app = resolveApp(d, out, args.app)
  if (!app) return out
  const components = catalog
    ? ((await catalog.getComponents({ appSlugs: [app.slug] }))[app.slug] ?? [])
    : []
  if (!catalog || !components.length) {
    return { app: app.slug, deployedTracked: false, ...out }
  }
  const rows = await catalog.listDeployments({ appSlugs: [app.slug] })
  const many = components.length > 1
  const deployed = rows
    // A target outside any env (a CI project, a bare namespace) is no env to name.
    .filter((r) => r.target.environmentSlug !== null)
    .map((r) => ({
      env: r.target.environmentSlug!,
      ...(many ? { component: r.component.slug } : {}),
      version: r.artifact.version,
      health: r.health?.state ?? null,
      deployedAt: r.deployedAt?.toISOString() ?? null,
    }))
    .filter((r) => !envHits || envHits.has(r.env))
    .sort((a, b) => a.env.localeCompare(b.env))
  return { app: app.slug, deployedTracked: true, envs: deployed, ...out }
}
