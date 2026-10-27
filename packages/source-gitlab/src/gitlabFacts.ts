import type {
  BuildOutcome,
  CatalogBuildInput,
  CatalogChangeRequestInput,
  CatalogTagInput,
} from '@env-hopper/backend-core'
import type {
  GitlabMergeRequestRecord,
  GitlabPipelineRecord,
  GitlabReleaseRecord,
  GitlabTagRecord,
} from './gitlabTypes'

/** A GitLab project as a delivery-fact Repository key. */
export const gitlabRepositoryKey = (projectId: number) => `gitlab:${projectId}`

const OUTCOMES: Record<string, BuildOutcome> = {
  success: 'succeeded',
  failed: 'failed',
  canceled: 'canceled',
}

const dateOf = (iso: string | null | undefined) =>
  iso ? new Date(iso) : undefined

/** Only the keys with a value: absent is "not known (yet)". */
const known = <T extends object>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null),
  ) as T

/** A pipeline as a Build; one still running has no outcome and no finishedAt. */
export function buildFact(p: GitlabPipelineRecord): CatalogBuildInput {
  const outcome = OUTCOMES[p.status]
  return known({
    repositoryKey: gitlabRepositoryKey(p.projectId),
    buildId: String(p.id),
    sha: p.sha,
    ref: p.ref,
    refType: p.tag
      ? 'tag'
      : /^refs\/merge-requests\/\d+\//.test(p.ref)
        ? 'change-request'
        : 'branch',
    trigger: p.source || undefined,
    outcome,
    finishedAt: outcome ? dateOf(p.finishedAt) : undefined,
    url: p.webUrl ?? undefined,
    triggeredBy: p.user ?? undefined,
  })
}

/**
 * One Tag per name, titled by its release. A release whose tag is not listed
 * is a Tag of its own when it names a commit, timed by its release.
 */
export function tagFacts(
  projectId: number,
  tags: Array<GitlabTagRecord>,
  releases: Array<GitlabReleaseRecord>,
): Array<CatalogTagInput> {
  const repositoryKey = gitlabRepositoryKey(projectId)
  const titleOf = new Map(releases.map((r) => [r.tagName, r.name]))
  const out = new Map<string, CatalogTagInput>()
  for (const t of tags) {
    out.set(
      t.name,
      known({
        repositoryKey,
        name: t.name,
        sha: t.commitSha,
        releaseTitle: titleOf.get(t.name),
        createdAt: dateOf(t.createdAt),
      }),
    )
  }
  for (const r of releases) {
    if (out.has(r.tagName) || !r.commitSha) continue
    out.set(
      r.tagName,
      known({
        repositoryKey,
        name: r.tagName,
        sha: r.commitSha,
        releaseTitle: r.name,
        createdAt: dateOf(r.releasedAt),
      }),
    )
  }
  return [...out.values()]
}

/** A merge request as a Change Request, with the Work Item keys it names. */
export function changeRequestFact(
  mr: GitlabMergeRequestRecord,
  workItems: Array<string>,
): CatalogChangeRequestInput {
  return known({
    repositoryKey: gitlabRepositoryKey(mr.projectId),
    number: String(mr.iid),
    title: mr.title,
    url: mr.webUrl,
    sourceBranch: mr.sourceBranch,
    targetBranch: mr.targetBranch,
    mergeSha: mr.mergeCommitSha ?? mr.squashCommitSha ?? undefined,
    mergedAt: dateOf(mr.mergedAt),
    author: mr.author ?? undefined,
    mergedBy: mr.mergedBy ?? undefined,
    workItems,
  })
}
