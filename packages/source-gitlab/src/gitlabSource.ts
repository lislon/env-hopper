import type {
  GitlabDeploymentRecord,
  GitlabEnvironmentRecord,
  GitlabMergeRequestRecord,
  GitlabSource,
  GitlabUserRecord,
  RawCommit,
  RawDeployment,
  RawEnvironment,
  RawMergeRequest,
  RawPipeline,
  RawRelease,
  RawUser,
} from './gitlabTypes'

function mergeRequestRecord(
  projectId: number,
  m: RawMergeRequest,
): GitlabMergeRequestRecord {
  return {
    projectId,
    iid: m.iid,
    title: m.title,
    description: m.description ?? '',
    sourceBranch: m.source_branch,
    targetBranch: m.target_branch,
    state: m.state,
    webUrl: m.web_url,
    mergeCommitSha: m.merge_commit_sha ?? null,
    squashCommitSha: m.squash_commit_sha ?? null,
  }
}

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
    tag: d.deployable?.tag ?? false,
    jobName: d.deployable?.name ?? '',
    pipelineId: d.deployable?.pipeline?.id ?? null,
    pipelineCreatedAt: d.deployable?.pipeline?.created_at ?? null,
    pipelineUrl: d.deployable?.pipeline?.web_url ?? null,
    committedAt: d.deployable?.commit?.committed_date ?? null,
    status: d.status,
    startedAt: d.deployable?.started_at ?? null,
    finishedAt: d.deployable?.finished_at ?? null,
    jobUrl: d.deployable?.web_url ?? null,
    user: userRecord(d.user),
    jobUser: userRecord(d.deployable?.user),
  }
}

function userRecord(u: RawUser | undefined): GitlabUserRecord | null {
  return u
    ? {
        username: u.username,
        name: u.name ?? null,
        avatarUrl: u.avatar_url ?? null,
        email: u.public_email || null,
      }
    : null
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
    /** Stop after this many pages, keeping what they held. */
    limit = Infinity,
  ): AsyncGenerator<Array<T>> {
    let page = '1'
    let pageCount = 0
    while (page) {
      pageCount++
      if (pageCount > limit) return
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

  async function all<T>(
    path: string,
    params?: Record<string, string>,
    limit?: number,
  ) {
    const out: Array<T> = []
    for await (const p of pages<T>(path, params, limit)) out.push(...p)
    return out
  }

  /** One JSON GET; null on 404. */
  async function one<T>(path: string): Promise<T | null> {
    const res = await f(`${baseUrl}/api/v4${path}`, {
      headers: { 'PRIVATE-TOKEN': token },
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`GitLab ${path}: ${res.status}`)
    return (await res.json()) as T
  }

  return {
    async getPipeline(projectId, id) {
      const p = await one<RawPipeline>(`/projects/${projectId}/pipelines/${id}`)
      return p
        ? {
            projectId,
            id: p.id,
            ref: p.ref,
            tag: p.tag ?? false,
            sha: p.sha,
            source: p.source ?? '',
            createdAt: p.created_at ?? null,
            webUrl: p.web_url ?? null,
          }
        : null
    },
    async getMergeRequest(projectId, iid) {
      const m = await one<RawMergeRequest>(
        `/projects/${projectId}/merge_requests/${iid}`,
      )
      return m ? mergeRequestRecord(projectId, m) : null
    },
    async mergeRequestCommits(projectId, iid, { limit = 100 } = {}) {
      const commits =
        (await one<Array<RawCommit>>(
          `/projects/${projectId}/merge_requests/${iid}/commits?per_page=${limit}`,
        )) ?? []
      return commits.map((c) => ({ sha: c.id, message: c.message }))
    },
    async commitMergeRequests(projectId, sha) {
      const list =
        (await one<Array<RawMergeRequest>>(
          `/projects/${projectId}/repository/commits/${encodeURIComponent(sha)}/merge_requests`,
        )) ?? []
      return list.map((m) => mergeRequestRecord(projectId, m))
    },
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
      {
        status = 'success',
        jobNames = () => true,
        updatedAfter,
        pageLimit,
      } = {},
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
        pageLimit,
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
        name: r.name || r.tag_name,
        tagName: r.tag_name,
        commitSha: r.commit?.id ?? null,
        author: r.author?.username ?? null,
        releasedAt: r.released_at ?? null,
      }))
    },
    async searchTags(projectId, search) {
      const res = await f(
        `${baseUrl}/api/v4/projects/${projectId}/repository/tags?search=${encodeURIComponent(search)}&per_page=20`,
        { headers: { 'PRIVATE-TOKEN': token } },
      )
      if (!res.ok) throw new Error(`GitLab tags ${projectId}: ${res.status}`)
      return (
        (await res.json()) as Array<{ name: string; commit?: { id: string } }>
      ).map((t) => ({ name: t.name, commitSha: t.commit?.id ?? null }))
    },
    async rawFile(projectId, path, ref) {
      const res = await f(
        `${baseUrl}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(path)}/raw?ref=${encodeURIComponent(ref)}`,
        { headers: { 'PRIVATE-TOKEN': token } },
      )
      if (res.status === 404) return null
      if (!res.ok)
        throw new Error(`GitLab file ${projectId} ${path}: ${res.status}`)
      return res.text()
    },
  }
}
