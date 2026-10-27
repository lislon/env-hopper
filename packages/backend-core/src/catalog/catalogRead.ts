import type { PrismaClient } from '../generated/prisma/client'
import { ALL_ENVS } from './catalogTypes'
import type {
  AppEnvFreshnessInput,
  BuiltAtSource,
  CatalogAppInput,
  CatalogArtifactInput,
  CatalogComponentInput,
  CatalogDeployAttemptInput,
  CatalogDeploymentInput,
  CatalogDeploymentTargetInput,
  CatalogEnvironmentInput,
  CatalogHealthInput,
  CatalogMeta,
  CatalogReleaseInput,
  CatalogUserInput,
  ChangeRequestRef,
  DeliveryFactsInput,
  DeliveryFactsView,
  DeployAttemptStatus,
  EndpointKind,
  FailureReason,
  HealthState,
  UserEventInput,
  UserEventView,
} from './catalogTypes'

/** A write transaction the Catalog opened; pass it to every sync of the run. */
export interface CatalogTx {
  readonly __catalogTx: never
}

/**
 * A committed transaction that changed what pair details show: a Deployment,
 * its Endpoints or its Health (a Health only checked again is no change).
 */
export interface CatalogChange {
  /** Unique per change in this process, and never reused after a restart. */
  id: string
  /** The pairs (App, Environment) whose Deployments changed. */
  pairs: Array<{ app: string; env: string }>
}

/** What one sync did to its table. */
export interface CatalogSyncCounts {
  created: number
  updated: number
  deleted: number
  unchanged: number
  /** When maxDeleteShare refused a mass delete, the count it would have deleted. */
  refusedDeletes?: number
}

export interface CatalogSyncOptions {
  /**
   * Create and update the listed rows, delete nothing: for a run that knows
   * only part of the scope.
   */
  upsertOnly?: boolean
  /**
   * Max fraction of stored rows one sync may delete (0..1). When set and
   * existing >= 5 and toDelete/existing > maxDeleteShare, no deletes happen.
   */
  maxDeleteShare?: number
}

type Sync<TInput> = (
  tx: CatalogTx,
  scope: string,
  list: Array<TInput>,
  opts?: CatalogSyncOptions,
) => Promise<CatalogSyncCounts>

/**
 * Each sync makes the rows of `scope` equal the list: new rows are created,
 * changed rows updated, identical rows left alone, and rows of the scope the
 * list no longer reports deleted together with what depends on them (none
 * with `upsertOnly`). A row another scope held is taken over. Sync parents before their children, all
 * inside one `transaction`, so readers never see half a run.
 */
export interface Catalog {
  transaction: <T>(
    fn: (tx: CatalogTx) => Promise<T>,
    opts?: { timeoutMs?: number },
  ) => Promise<T>
  syncEnvironments: Sync<CatalogEnvironmentInput>
  syncApps: Sync<CatalogAppInput>
  syncComponents: Sync<CatalogComponentInput>
  syncTargets: Sync<CatalogDeploymentTargetInput>
  /** Users before the Deployments that name them. */
  syncUsers: Sync<CatalogUserInput>
  syncReleases: Sync<CatalogReleaseInput>
  syncArtifacts: Sync<CatalogArtifactInput>
  /** Counts the Deployments; each Deployment's Endpoints are synced with it. */
  syncDeployments: Sync<CatalogDeploymentInput>
  syncHealth: Sync<CatalogHealthInput>
  /**
   * The Deploy Attempts the Entity Provider chose to show, at most one per
   * (Component, Target). Their Artifacts and Users before them.
   */
  syncDeployAttempts: Sync<CatalogDeployAttemptInput>
  /**
   * How fresh each AppEnv is, as the Entity Provider last read it. Not a
   * change a reader is told about: a freshness only moves time.
   */
  syncAppEnvFreshness: Sync<AppEnvFreshnessInput>
  /**
   * Calls `listener` after each committed transaction that changed a pair's
   * Deployments. Returns the function that stops it.
   */
  onChange: (listener: (change: CatalogChange) => void) => () => void
  /** The id of the last change committed; before any, an id of its own. */
  lastChangeId: () => string
  /** Filters are AND-ed; an omitted one takes all. */
  listDeployments: (filter?: {
    appSlugs?: Array<string>
    environmentSlugs?: Array<string>
  }) => Promise<Array<CatalogDeploymentView>>
  resolveAlias: (
    componentSlug: string,
    alias: string,
  ) => Promise<CatalogArtifactView | null>
  /**
   * One Deployment per Component per pair (App, Environment), for the
   * Components of `appSlugs` deployed on `envSlugs`; an omitted filter takes
   * all. Pairs with nothing deployed are absent from `pairs`.
   */
  getPairDeployments: (filter: {
    appSlugs?: Array<string>
    envSlugs?: Array<string>
  }) => Promise<PairDeployments>
  /**
   * Each App's Components, the lead marked, for `appSlugs` or for every App
   * when that filter is omitted. Apps without Components are absent.
   */
  getComponents: (filter: {
    appSlugs?: Array<string>
  }) => Promise<Record<string, Array<AppComponent>>>
  /** The profiles of the Users named, by username; unknown ones are absent. */
  getUsers: (usernames: Array<string>) => Promise<PairDeployment['users']>
  /**
   * What AppEnvs showed, each time it changed, newest first: "what ran on
   * qa last Tuesday at 14:00", "when did this version reach prod". At most
   * `HISTORY_LIMIT` rows; narrow by App, Environment, Component and time.
   */
  getDeploymentHistory: (filter: {
    app?: string
    env?: string
    component?: string
    from?: Date
    to?: Date
  }) => Promise<Array<DeploymentHistoryEntry>>
  /**
   * Delivery facts (ADR 0007), insert-if-absent; a NULL column is filled
   * once; a stored value never changes. Work Items are replaced (snapshots).
   * Its own transaction; tells no listener.
   */
  writeFacts: (facts: DeliveryFactsInput) => Promise<void>
  /**
   * builds: by key. commits: by key, plus each read build's commit.
   * tags: at those commits, plus tags of a queried build's repository whose name ends with its buildId.
   * changeRequests: by key, plus those the read commits name (changeRequestNumber).
   * declaredVersions: at the read commits.
   */
  readFacts: (q: {
    builds?: Array<{ repositoryKey: string; buildId: string }>
    commits?: Array<{ repositoryKey: string; sha: string }>
    changeRequests?: Array<{ repositoryKey: string; number: string }>
  }) => Promise<DeliveryFactsView>
  /** The newest stored Tag (by createdAt), with `released` only one with a releaseTitle: where an incremental list stops. */
  newestTagName: (
    repositoryKey: string,
    opts?: { released?: boolean },
  ) => Promise<string | null>
  /** Keeps what a User did, forever (ADR 0006): who uses what, and when. */
  recordUserEvent: (event: UserEventInput) => Promise<void>
  /** Every User's events since `since`, oldest first. */
  /**
   * Events since `since`, oldest first; with `userId` (an account or an
   * EhUser id), only that User's: every EhUser linked to the same account.
   */
  getUserEvents: (
    since: Date,
    filter?: { userId?: string },
  ) => Promise<Array<UserEventView>>
}

/** At most this many DeploymentHistory rows per read. */
export const HISTORY_LIMIT = 1000

/** One change of what an AppEnv showed; JSON-ready. */
export interface DeploymentHistoryEntry {
  componentSlug: string
  targetSlug: string
  appSlug?: string
  envSlug?: string
  kind: 'deployed' | 'removed' | 'attempt'
  version?: string
  previous?: string
  status?: string
  deployedAt?: string
  deployedBy?: string
  source?: string
  /** When it happened, by the Source's clock. */
  eventAt?: string
  observedAt: string
}

/** JSON-ready (dates as ISO strings): it is served as is. */
export interface PairDeployment {
  /** How fresh what the AppEnv shows is; absent when the Entity Provider writes none. */
  freshness?: AppEnvFreshness
  components: Array<{
    slug: string
    displayName: string
    lead?: true
    /** The page of a commit, with `{{sha}}` where a row's `commitSha` goes. */
    commitUrl?: string
  }>
  /** The Users the rows name, by username. */
  users: Record<
    string,
    { firstName?: string; lastName?: string; avatarUrl?: string }
  >
  rows: Array<{
    componentSlug: string
    targetSlug: string
    /**
     * Where a cluster runs the Deployment, from its Target's `meta.cluster`,
     * `meta.namespace` and `meta.kubeContext` (the kubeconfig context that
     * reaches the cluster; absent: the cluster's name). Absent when the
     * Target does not say.
     */
    cluster?: string
    namespace?: string
    kubeContext?: string
    version: string
    aliases: Array<string>
    buildUrl?: string
    /** The commit the build was made from. */
    commitSha?: string
    /** The change request the build was made from or merged by. */
    changeRequest?: ChangeRequestRef
    deployUrl?: string
    deployedAt?: string
    /** Username, a key of `users`. */
    deployedBy?: string
    source: string
    /** Absent: nothing checks it. */
    health?: {
      state: HealthState
      checker: string
      observedAt: string
      detail?: string
    }
    endpoints?: Array<{ kind: EndpointKind; url: string; label?: string }>
    /**
     * The newest Deploy Attempt of this Component on the Environment, as the
     * Entity Provider wrote it. Absent: none.
     */
    attempt?: PairDeployAttempt
  }>
}

/** A deploy run that has not succeeded (yet), as pair details show it. */
export interface PairDeployAttempt {
  version: string
  /** Only when the Artifact has some. */
  aliases?: Array<string>
  status: DeployAttemptStatus
  /** Absent when only the run's end was recorded. */
  startedAt?: string
  /** Absent while running. */
  endedAt?: string
  /** Username, a key of `users`. */
  by?: string
  /** May differ from the row's own Target when the Environment spans several. */
  targetSlug: string
  /** The Artifact's build pipeline. */
  buildUrl?: string
  /** The deploy pipeline. */
  deployUrl?: string
  /** The deploy job itself. */
  jobUrl?: string
  commitSha?: string
  /** The change request the attempt's build was made from or merged by. */
  changeRequest?: ChangeRequestRef
  /** Branch, tag or merge-request ref deployed. */
  ref?: string
}

/**
 * A Component as pair details show it. `pipelineUrl` is the URL most of its
 * Deployments' build and deploy links fit, with `{{id}}` where each link's id
 * goes: it depends on the Component alone, not on which pairs are read.
 */
export interface AppComponent {
  slug: string
  displayName: string
  lead?: true
  pipelineUrl?: string
  /** The page of a commit of its code, with `{{sha}}` where the commit goes. */
  commitUrl?: string
}

/** A URL ending in an id: the URL with `{{id}}` there, and the id. */
export function splitId(
  url: string,
): [template: string, id: string] | undefined {
  const m = /^(.*?)(\d+)$/.exec(url)
  return m ? [`${m[1]}{{id}}`, m[2]!] : undefined
}

/** Per Component, the template most of its links fit; a tie goes to the first by name. */
function pipelineUrls(
  links: Array<{ componentSlug: string; url: string | null }>,
): Map<string, string> {
  const counts = new Map<string, Map<string, number>>()
  for (const { componentSlug, url } of links) {
    const split = url ? splitId(url) : undefined
    if (!split) continue
    const byTemplate = counts.get(componentSlug) ?? new Map<string, number>()
    counts.set(componentSlug, byTemplate)
    byTemplate.set(split[0], (byTemplate.get(split[0]) ?? 0) + 1)
  }
  return new Map(
    [...counts].map(([slug, byTemplate]) => [
      slug,
      [...byTemplate].sort(
        (a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0),
      )[0]![0],
    ]),
  )
}

export interface PairDeployments {
  pairs: Array<{
    app: string
    env: string
    rows: PairDeployment['rows']
    users: PairDeployment['users']
  }>
  /** Each AppEnv's freshness the Entity Provider wrote, deployed there or not. */
  freshness?: Array<{ app: string; env: string } & AppEnvFreshness>
}

/** How fresh what an AppEnv shows is; ISO dates. */
export interface AppEnvFreshness {
  checkedAt: string
  reading?: Array<string>
  failed?: {
    source: string
    at: string
    reason?: FailureReason
    message?: string
  }
  /** Each Source it is read from, and when it was last read. */
  sources?: Array<{ source: string; at: string }>
}

export interface CatalogArtifactView {
  version: string
  aliases: Array<string>
  builtAt: Date | null
  builtAtSource: BuiltAtSource | null
  buildUrl: string | null
  commitSha: string | null
  changeRequest: ChangeRequestRef | null
  release: CatalogReleaseInput | null
}

export interface CatalogUserView {
  username: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}

export interface CatalogDeploymentView {
  component: { slug: string; displayName: string; appSlug: string | null }
  target: {
    slug: string
    displayName: string
    environmentSlug: string | null
    meta: CatalogMeta
  }
  artifact: CatalogArtifactView
  source: string
  deployedAt: Date | null
  deployedBy: CatalogUserView | null
  deployUrl: string | null
  endpoints: Array<{ kind: EndpointKind; url: string; label?: string }>
  health: {
    state: HealthState
    observedAt: Date
    checker: string
    detail: string | null
  } | null
}

/** Bounded batches: Postgres takes at most 65535 bind parameters a query. */
export function chunks<T>(list: Array<T>, size = 1000): Array<Array<T>> {
  const out: Array<Array<T>> = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

/**
 * A stored fact as read: NULL columns left out but `keepNull`, and `createdAt`
 * (when the row was stored, not a fact) unless `withCreatedAt`.
 */
function present<T>(
  row: object,
  { keepNull = [] as Array<string>, withCreatedAt = false } = {},
): T {
  return Object.fromEntries(
    Object.entries(row).filter(
      ([k, v]) =>
        (v !== null || keepNull.includes(k)) &&
        (withCreatedAt || k !== 'createdAt'),
    ),
  ) as T
}

/** Rows found by a list of keys, one query per chunk. */
async function byKeys<TKey, TRow>(
  keys: Array<TKey>,
  find: (part: Array<TKey>) => Promise<Array<TRow>>,
): Promise<Array<TRow>> {
  return (await Promise.all(chunks(keys).map(find))).flat()
}

const uniqueBy = <T>(list: Array<T>, key: (t: T) => string) => [
  ...new Map(list.map((t) => [key(t), t])).values(),
]

export function createCatalogReads(prisma: PrismaClient) {
  const reads = {
    async readFacts(q: {
      builds?: Array<{ repositoryKey: string; buildId: string }>
      commits?: Array<{ repositoryKey: string; sha: string }>
      changeRequests?: Array<{ repositoryKey: string; number: string }>
    }): Promise<DeliveryFactsView> {
      const builds = await byKeys(q.builds ?? [], (part) =>
        prisma.catalogBuild.findMany({
          where: {
            OR: part.map(({ repositoryKey, buildId }) => ({
              repositoryKey,
              buildId,
            })),
          },
          orderBy: [{ repositoryKey: 'asc' }, { buildId: 'asc' }],
        }),
      )
      const commitKeys = uniqueBy(
        [...(q.commits ?? []), ...builds].map(({ repositoryKey, sha }) => ({
          repositoryKey,
          sha,
        })),
        (c) => `${c.repositoryKey}\0${c.sha}`,
      )
      const atCommits = (part: typeof commitKeys) => ({ OR: part })
      const [commits, tags, declaredVersions] = await Promise.all([
        byKeys(commitKeys, (part) =>
          prisma.catalogCommit.findMany({ where: atCommits(part) }),
        ),
        byKeys(
          [
            ...commitKeys,
            ...(q.builds ?? []).map(({ repositoryKey, buildId }) => ({
              repositoryKey,
              name: { endsWith: buildId },
            })),
          ],
          (part) => prisma.catalogTag.findMany({ where: { OR: part } }),
        ),
        byKeys(commitKeys, (part) =>
          prisma.catalogDeclaredVersion.findMany({
            where: atCommits(part),
            orderBy: { type: 'asc' },
          }),
        ),
      ])
      const crKeys = uniqueBy(
        [
          ...(q.changeRequests ?? []),
          ...commits.flatMap((c) =>
            c.changeRequestNumber
              ? [
                  {
                    repositoryKey: c.repositoryKey,
                    number: c.changeRequestNumber,
                  },
                ]
              : [],
          ),
        ],
        (k) => `${k.repositoryKey}\0${k.number}`,
      )
      const [changeRequests, links] = await Promise.all([
        byKeys(crKeys, (part) =>
          prisma.catalogChangeRequest.findMany({
            where: { OR: part },
            orderBy: [{ repositoryKey: 'asc' }, { number: 'asc' }],
          }),
        ),
        byKeys(crKeys, (part) =>
          prisma.catalogChangeRequestWorkItem.findMany({
            where: { OR: part },
            orderBy: { position: 'asc' },
          }),
        ),
      ])
      const workItemsOf = (r: { repositoryKey: string; number: string }) =>
        links
          .filter(
            (l) => l.repositoryKey === r.repositoryKey && l.number === r.number,
          )
          .map((l) => l.workItemKey)
      return {
        commits: commits.map((c) => present(c)),
        builds: builds.map((b) => present(b)),
        tags: uniqueBy(tags, (t) => `${t.repositoryKey}\0${t.name}`)
          .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
          .map((t) => present(t, { withCreatedAt: true })),
        changeRequests: changeRequests.map((r) => {
          const workItems = workItemsOf(r)
          return present({ ...r, ...(workItems.length > 0 && { workItems }) })
        }),
        declaredVersions: declaredVersions.map((d) =>
          present(d, { keepNull: ['value'] }),
        ),
      }
    },
    async newestTagName(
      repositoryKey: string,
      opts: { released?: boolean } = {},
    ) {
      const tag = await prisma.catalogTag.findFirst({
        where: {
          repositoryKey,
          ...(opts.released && { releaseTitle: { not: null } }),
        },
        orderBy: [
          { createdAt: { sort: 'desc', nulls: 'last' } },
          { name: 'desc' },
        ],
        select: { name: true },
      })
      return tag?.name ?? null
    },
    async listDeployments(
      filter: {
        appSlugs?: Array<string>
        environmentSlugs?: Array<string>
      } = {},
    ) {
      const rows = await prisma.catalogDeployment.findMany({
        where: {
          component: filter.appSlugs
            ? { appSlug: { in: filter.appSlugs } }
            : undefined,
          target: filter.environmentSlugs
            ? { environmentSlug: { in: filter.environmentSlugs } }
            : undefined,
        },
        include: {
          component: true,
          target: true,
          artifact: { include: { release: true } },
          deployer: true,
          endpoints: true,
        },
        orderBy: [{ componentSlug: 'asc' }, { targetSlug: 'asc' }],
      })
      const health = (
        await Promise.all(
          chunks(rows).map((part) =>
            prisma.catalogHealth.findMany({
              where: {
                OR: part.map((r) => ({
                  componentSlug: r.componentSlug,
                  targetSlug: r.targetSlug,
                })),
              },
            }),
          ),
        )
      ).flat()
      const healthOf = new Map(
        health.map((h) => [`${h.componentSlug}\u0000${h.targetSlug}`, h]),
      )
      return rows.map((r) => {
        const h = healthOf.get(`${r.componentSlug}\u0000${r.targetSlug}`)
        return {
          component: {
            slug: r.component.slug,
            displayName: r.component.displayName,
            appSlug: r.component.appSlug,
          },
          target: {
            slug: r.target.slug,
            displayName: r.target.displayName,
            environmentSlug: r.target.environmentSlug,
            meta: r.target.meta as CatalogMeta,
          },
          artifact: toArtifactView(r.artifact),
          source: r.source,
          deployedAt: r.deployedAt,
          deployedBy: r.deployer
            ? {
                username: r.deployer.username,
                firstName: r.deployer.firstName,
                lastName: r.deployer.lastName,
                avatarUrl: r.deployer.avatarUrl,
              }
            : null,
          deployUrl: r.deployUrl,
          endpoints: r.endpoints.map((e) => ({
            kind: e.kind as EndpointKind,
            url: e.url,
            label: e.label ?? undefined,
          })),
          health: h
            ? {
                state: h.state as HealthState,
                observedAt: h.observedAt,
                checker: h.checker,
                detail: h.detail,
              }
            : null,
        } satisfies CatalogDeploymentView
      })
    },
    async getPairDeployments(filter: {
      appSlugs?: Array<string>
      envSlugs?: Array<string>
    }): Promise<PairDeployments> {
      const { appSlugs, envSlugs } = filter
      const rows = await reads.listDeployments({
        appSlugs,
        environmentSlugs: envSlugs,
      })
      // One Deployment per Component per Environment: a live Target wins over
      // a retired one (meta.retired = 'true'), then the latest deploy.
      const rank = (d: CatalogDeploymentView) =>
        [
          d.target.meta['retired'] === 'true' ? 0 : 1,
          d.deployedAt?.getTime() ?? 0,
        ] as const
      const best = new Map<string, CatalogDeploymentView>()
      for (const d of rows) {
        if (!d.target.environmentSlug || !d.component.appSlug) continue
        const key = `${d.target.environmentSlug}\u0000${d.component.slug}`
        const held = best.get(key)
        const [a0, a1] = rank(d)
        const [b0, b1] = held ? rank(held) : [-1, -1]
        if (a0 > b0 || (a0 === b0 && a1 > b1)) best.set(key, d)
      }
      const attempts = await reads.newestAttempts(
        [...best.values()].map((d) => d.component.slug),
        envSlugs,
      )
      const pairs = new Map<string, PairDeployments['pairs'][number]>()
      for (const d of best.values()) {
        const app = d.component.appSlug!
        const env = d.target.environmentSlug!
        const key = `${app}\u0000${env}`
        const pair = pairs.get(key) ?? { app, env, rows: [], users: {} }
        pairs.set(key, pair)
        const u = d.deployedBy
        if (u) pair.users[u.username] = profileOf(u)
        const h = d.health
        const { cluster, namespace, kubeContext } = d.target.meta
        pair.rows.push({
          componentSlug: d.component.slug,
          targetSlug: d.target.slug,
          ...(cluster && { cluster }),
          ...(namespace && { namespace }),
          ...(kubeContext && { kubeContext }),
          version: d.artifact.version,
          aliases: d.artifact.aliases,
          ...(d.artifact.buildUrl && { buildUrl: d.artifact.buildUrl }),
          ...(d.artifact.commitSha && { commitSha: d.artifact.commitSha }),
          ...(d.artifact.changeRequest && {
            changeRequest: d.artifact.changeRequest,
          }),
          ...(d.deployUrl && { deployUrl: d.deployUrl }),
          ...(d.deployedAt && { deployedAt: d.deployedAt.toISOString() }),
          ...(u && { deployedBy: u.username }),
          source: d.source,
          ...(h && {
            health: {
              state: h.state,
              checker: h.checker,
              observedAt: h.observedAt.toISOString(),
              ...(h.detail && { detail: h.detail }),
            },
          }),
          ...(d.endpoints.length > 0 && { endpoints: d.endpoints }),
        })
        const a = attempts.get(
          `${d.target.environmentSlug}\u0000${d.component.slug}`,
        )
        if (a) {
          pair.rows.at(-1)!.attempt = a.attempt
          if (a.starter) pair.users[a.starter.username] = profileOf(a.starter)
        }
      }
      const fresh = await prisma.appEnvFreshness.findMany({
        where: {
          ...(appSlugs && { appSlug: { in: appSlugs } }),
          ...(envSlugs && { envSlug: { in: [...envSlugs, ALL_ENVS] } }),
        },
        orderBy: [{ appSlug: 'asc' }, { envSlug: 'asc' }],
      })
      return {
        pairs: [...pairs.values()],
        ...(fresh.length > 0 && {
          freshness: fresh.map((f) => ({
            app: f.appSlug,
            env: f.envSlug,
            checkedAt: f.checkedAt.toISOString(),
            ...(f.reading.length > 0 && { reading: f.reading }),
            ...(f.failedSource &&
              f.failedAt && {
                failed: {
                  source: f.failedSource,
                  at: f.failedAt.toISOString(),
                  ...(f.failedReason && {
                    reason: f.failedReason as FailureReason,
                  }),
                  ...(f.failedMessage && { message: f.failedMessage }),
                },
              }),
            ...(Array.isArray(f.sources) &&
              f.sources.length > 0 && {
                sources: f.sources as AppEnvFreshness['sources'],
              }),
          })),
        }),
      }
    },
    /** Per Environment and Component, the newest attempt on the Environment's Targets. */
    async newestAttempts(
      componentSlugs: Array<string>,
      envSlugs?: Array<string>,
    ) {
      const rows =
        componentSlugs.length === 0
          ? []
          : await prisma.catalogDeployAttempt.findMany({
              where: {
                componentSlug: { in: [...new Set(componentSlugs)] },
                target: {
                  environmentSlug: envSlugs ? { in: envSlugs } : { not: null },
                },
              },
              include: {
                target: { select: { environmentSlug: true } },
                artifact: {
                  select: {
                    aliases: true,
                    buildUrl: true,
                    commitSha: true,
                    changeRequest: true,
                  },
                },
                starter: true,
              },
            })
      const at = (r: (typeof rows)[number]) =>
        (r.startedAt ?? r.endedAt)?.getTime() ?? 0
      const newest = new Map<string, (typeof rows)[number]>()
      for (const r of rows) {
        const key = `${r.target.environmentSlug}\u0000${r.componentSlug}`
        const held = newest.get(key)
        if (!held || at(r) > at(held)) newest.set(key, r)
      }
      return new Map(
        [...newest].map(([key, r]) => [
          key,
          {
            starter: r.starter,
            attempt: {
              version: r.version,
              ...(r.artifact.aliases.length > 0 && {
                aliases: r.artifact.aliases,
              }),
              status: r.status as DeployAttemptStatus,
              ...(r.startedAt && { startedAt: r.startedAt.toISOString() }),
              ...(r.endedAt && { endedAt: r.endedAt.toISOString() }),
              ...(r.startedBy && { by: r.startedBy }),
              targetSlug: r.targetSlug,
              ...(r.artifact.buildUrl && { buildUrl: r.artifact.buildUrl }),
              ...(r.deployUrl && { deployUrl: r.deployUrl }),
              ...(r.jobUrl && { jobUrl: r.jobUrl }),
              ...(r.artifact.commitSha && { commitSha: r.artifact.commitSha }),
              ...(r.artifact.changeRequest
                ? {
                    changeRequest: r.artifact
                      .changeRequest as unknown as ChangeRequestRef,
                  }
                : {}),
              ...(r.ref && { ref: r.ref }),
            } satisfies PairDeployAttempt,
          },
        ]),
      )
    },
    async getComponents({ appSlugs }: { appSlugs?: Array<string> }) {
      const [apps, links] = await Promise.all([
        prisma.catalogApp.findMany({
          where: appSlugs ? { slug: { in: appSlugs } } : undefined,
          select: {
            slug: true,
            leadComponentSlug: true,
            components: {
              select: { slug: true, displayName: true, commitUrl: true },
              orderBy: { slug: 'asc' },
            },
          },
        }),
        prisma.catalogDeployment.findMany({
          where: {
            component: appSlugs
              ? { appSlug: { in: appSlugs } }
              : { appSlug: { not: null } },
          },
          select: {
            componentSlug: true,
            deployUrl: true,
            artifact: { select: { buildUrl: true } },
          },
        }),
      ])
      const urls = pipelineUrls(
        links.flatMap((l) => [
          { componentSlug: l.componentSlug, url: l.artifact.buildUrl },
          { componentSlug: l.componentSlug, url: l.deployUrl },
        ]),
      )
      const components: Record<string, Array<AppComponent>> = {}
      for (const a of apps) {
        if (a.components.length === 0) continue
        const lead = a.leadComponentSlug ?? a.components[0]!.slug
        components[a.slug] = a.components.map(({ commitUrl, ...c }) => {
          const pipelineUrl = urls.get(c.slug)
          return {
            ...c,
            ...(commitUrl && { commitUrl }),
            ...(c.slug === lead && { lead: true as const }),
            ...(pipelineUrl && { pipelineUrl }),
          }
        })
      }
      return components
    },
    async getDeploymentHistory({
      app,
      env,
      component,
      from,
      to,
    }: Parameters<Catalog['getDeploymentHistory']>[0]) {
      const rows = await prisma.deploymentHistory.findMany({
        where: {
          ...(app && { appSlug: app }),
          ...(env && { envSlug: env }),
          ...(component && { componentSlug: component }),
          ...((from || to) && {
            observedAt: { ...(from && { gte: from }), ...(to && { lte: to }) },
          }),
        },
        orderBy: { id: 'desc' },
        take: HISTORY_LIMIT,
      })
      return rows.map(
        ({ id: _, observedAt, deployedAt, eventAt, kind, ...r }) => ({
          ...(Object.fromEntries(
            Object.entries(r).filter(([, v]) => v !== null),
          ) as Pick<DeploymentHistoryEntry, 'componentSlug' | 'targetSlug'>),
          kind: kind as DeploymentHistoryEntry['kind'],
          ...(deployedAt && { deployedAt: deployedAt.toISOString() }),
          ...(eventAt && { eventAt: eventAt.toISOString() }),
          observedAt: observedAt.toISOString(),
        }),
      )
    },
    async recordUserEvent({
      ehUserId,
      userId,
      at: told,
      ...event
    }: UserEventInput) {
      const at = new Date()
      await prisma.ehUser.upsert({
        where: { id: ehUserId },
        create: {
          id: ehUserId,
          userId: userId ?? null,
          firstSeenAt: at,
          lastSeenAt: at,
        },
        update: { lastSeenAt: at },
      })
      // Linked at its first sign-in, and never moved: `userId: null` only.
      if (userId) {
        await prisma.ehUser.updateMany({
          where: { id: ehUserId, userId: null },
          data: { userId },
        })
      }
      // ON CONFLICT (eventId) DO NOTHING: a retried send is kept once.
      await prisma.userEvent.createMany({
        skipDuplicates: true,
        data: [{ userId: ehUserId, ...event, at: told ?? at, receivedAt: at }],
      })
    },
    async getUserEvents(since: Date, filter: { userId?: string } = {}) {
      let users: Array<{ id?: string; userId?: string }> | undefined
      if (filter.userId) {
        const own = await prisma.ehUser.findUnique({
          where: { id: filter.userId },
          select: { userId: true },
        })
        const account = own?.userId ?? filter.userId
        users = [{ id: filter.userId }, { userId: account }]
      }
      const events = await prisma.userEvent.findMany({
        where: { at: { gte: since }, ...(users && { user: { OR: users } }) },
        orderBy: [{ at: 'asc' }, { id: 'asc' }],
        select: {
          userId: true,
          kind: true,
          appSlug: true,
          envSlug: true,
          resourceJump: true,
          url: true,
          at: true,
          user: { select: { userId: true } },
        },
      })
      return events.map(
        ({ userId: ehUserId, user, resourceJump, url, kind, ...e }) => ({
          ehUserId,
          ...(user.userId && { userId: user.userId }),
          ...e,
          kind: kind as UserEventView['kind'],
          ...(resourceJump && { resourceJump }),
          ...(url && { url }),
        }),
      )
    },
    async getUsers(usernames: Array<string>) {
      const users = await prisma.catalogUser.findMany({
        where: { username: { in: usernames } },
        select: {
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      })
      return Object.fromEntries(users.map((u) => [u.username, profileOf(u)]))
    },
    async resolveAlias(componentSlug: string, alias: string) {
      const a = await prisma.catalogArtifact.findFirst({
        where: { componentSlug, aliases: { has: alias } },
        orderBy: [
          { builtAt: { sort: 'desc', nulls: 'last' } },
          { version: 'desc' },
        ],
        include: { release: true },
      })
      return a ? toArtifactView(a) : null
    },
  }
  return reads
}

/** What a User shows: the name and avatar, never the contact details. */
function profileOf(u: {
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}): PairDeployment['users'][string] {
  return {
    ...(u.firstName && { firstName: u.firstName }),
    ...(u.lastName && { lastName: u.lastName }),
    ...(u.avatarUrl && { avatarUrl: u.avatarUrl }),
  }
}

function toArtifactView(artifact: {
  version: string
  aliases: Array<string>
  builtAt: Date | null
  builtAtSource: string | null
  buildUrl: string | null
  commitSha: string | null
  changeRequest: unknown
  release: {
    key: string
    tag: string | null
    commitSha: string | null
    author: string | null
    releasedAt: Date | null
  } | null
}): CatalogArtifactView {
  return {
    version: artifact.version,
    aliases: artifact.aliases,
    builtAt: artifact.builtAt,
    builtAtSource: artifact.builtAtSource as BuiltAtSource | null,
    buildUrl: artifact.buildUrl,
    commitSha: artifact.commitSha,
    changeRequest: (artifact.changeRequest ?? null) as ChangeRequestRef | null,
    release: artifact.release
      ? {
          key: artifact.release.key,
          tag: artifact.release.tag ?? undefined,
          commitSha: artifact.release.commitSha ?? undefined,
          author: artifact.release.author ?? undefined,
          releasedAt: artifact.release.releasedAt ?? undefined,
        }
      : null,
  }
}
