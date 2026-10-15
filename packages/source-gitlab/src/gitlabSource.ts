import type {
  GitlabDeploymentRecord,
  GitlabEnvironmentRecord,
  GitlabSource,
  RawDeployment,
  RawEnvironment,
  RawRelease,
} from './gitlabTypes'

function environmentRecord(
  projectId: number,
  e: RawEnvironment,
): GitlabEnvironmentRecord {
  return {
    projectId,
    id: e.id,
    name: e.name,
    tier: e.tier ?? null,
    externalUrl: e.external_url ?? null,
    state: e.state,
    lastDeployedAt: e.last_deployment?.created_at ?? null,
  }
}

function deploymentRecord(
  projectId: number,
  environmentName: string,
  d: Omit<RawDeployment, 'environment'>,
): GitlabDeploymentRecord {
  return {
    projectId,
    environmentName,
    ref: d.ref,
    sha: d.sha,
    tag: d.tag ?? false,
    jobName: d.deployable?.name ?? '',
    pipelineId: d.deployable?.pipeline?.id ?? null,
    pipelineCreatedAt: d.deployable?.pipeline?.created_at ?? null,
    status: d.status,
    finishedAt: d.deployable?.finished_at ?? null,
  }
}

export function createGitlabSource({
  baseUrl,
  token,
  fetch: f = fetch,
  perPage = 100,
  maxPages = 1000,
}: {
  baseUrl: string
  token: string
  fetch?: typeof fetch
  perPage?: number
  maxPages?: number
}): GitlabSource {
  async function* pages<T>(
    path: string,
    params: Record<string, string> = {},
  ): AsyncGenerator<Array<T>> {
    let page = '1'
    let pageCount = 0
    while (page) {
      pageCount++
      if (pageCount > maxPages) {
        throw new Error(
          `GitLab ${path}: exceeded maxPages limit of ${maxPages}`,
        )
      }
      const q = new URLSearchParams({
        ...params,
        per_page: String(perPage),
        page,
      })
      const res = await f(`${baseUrl}/api/v4${path}?${q}`, {
        headers: { 'PRIVATE-TOKEN': token },
      })
      if (!res.ok) throw new Error(`GitLab ${path}: ${res.status}`)
      yield (await res.json()) as Array<T>
      page = res.headers.get('x-next-page') ?? ''
    }
  }

  async function all<T>(path: string, params?: Record<string, string>) {
    const out: Array<T> = []
    for await (const p of pages<T>(path, params)) out.push(...p)
    return out
  }

  return {
    async listEnvironments(projectId, { states = ['available'] } = {}) {
      const out: Array<GitlabEnvironmentRecord> = []
      for (const state of states) {
        for (const e of await all<RawEnvironment>(
          `/projects/${projectId}/environments`,
          { states: state },
        )) {
          out.push(environmentRecord(projectId, e))
        }
      }
      return out
    },
    async latestDeployments(
      projectId,
      { status = 'success', jobNames = () => true, updatedAfter } = {},
    ) {
      const latest = new Map<string, GitlabDeploymentRecord>()
      for (const d of await all<RawDeployment>(
        `/projects/${projectId}/deployments`,
        {
          status,
          // GitLab accepts updated_after only together with this order.
          order_by: 'updated_at',
          sort: 'desc',
          ...(updatedAfter
            ? { updated_after: updatedAfter.toISOString() }
            : {}),
        },
      )) {
        const env = d.environment.name
        // The API's status filter is trusted but re-checked: a stale-status row
        // must never become "what runs there".
        if (
          d.status !== status ||
          latest.has(env) ||
          !jobNames(d.deployable?.name ?? '')
        )
          continue
        latest.set(env, deploymentRecord(projectId, env, d))
      }
      return [...latest.values()]
    },
    async getEnvironment(projectId, environmentId) {
      const res = await f(
        `${baseUrl}/api/v4/projects/${projectId}/environments/${environmentId}`,
        { headers: { 'PRIVATE-TOKEN': token } },
      )
      if (!res.ok)
        throw new Error(
          `GitLab /projects/${projectId}/environments/${environmentId}: ${res.status}`,
        )
      const e = (await res.json()) as RawEnvironment
      return {
        environment: environmentRecord(projectId, e),
        lastDeployment: e.last_deployment
          ? deploymentRecord(projectId, e.name, e.last_deployment)
          : null,
      }
    },
    async listReleases(projectId, { limit = 50 } = {}) {
      const res = await f(
        `${baseUrl}/api/v4/projects/${projectId}/releases?per_page=${limit}`,
        { headers: { 'PRIVATE-TOKEN': token } },
      )
      if (!res.ok)
        throw new Error(`GitLab releases ${projectId}: ${res.status}`)
      return ((await res.json()) as Array<RawRelease>).map((r) => ({
        projectId,
        tagName: r.tag_name,
        commitSha: r.commit?.id ?? null,
        author: r.author?.username ?? null,
        releasedAt: r.released_at ?? null,
      }))
    },
  }
}
