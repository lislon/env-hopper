export interface GitlabEnvironmentRecord {
  projectId: number
  id: number
  name: string
  tier: string | null
  externalUrl: string | null
  state: string
  /**
   * When the environment was last deployed. Only `getEnvironment` fills it:
   * GitLab's environment list does not return the last deployment, so
   * `listEnvironments` always leaves it null.
   */
  lastDeployedAt: string | null
}

export interface GitlabDeploymentRecord {
  projectId: number
  environmentName: string
  ref: string
  sha: string
  /** True when `ref` is a tag. */
  tag: boolean
  jobName: string
  pipelineId: number | null
  /** When the deploy job's pipeline was created: the closest GitLab has to a build time. */
  pipelineCreatedAt: string | null
  /** The deploy pipeline's page. */
  pipelineUrl: string | null
  /** When the deployed commit was committed. */
  committedAt: string | null
  status: string
  /**
   * When the deploy job started; null when it never did (a job canceled or
   * failed before a runner took it, or one still waiting).
   */
  startedAt: string | null
  finishedAt: string | null
  /** The deploy job's page. */
  jobUrl: string | null
  /**
   * Whose action created the deployment record: for a manual deploy job, who
   * started its pipeline, not who ran the job.
   */
  user: GitlabUserRecord | null
  /** Who ran the deploy job, e.g. played it when manual. */
  jobUser: GitlabUserRecord | null
}

export interface GitlabUserRecord {
  username: string
  name: string | null
  avatarUrl: string | null
  /** Only when the user made it public. */
  email: string | null
}

export interface GitlabReleaseRecord {
  projectId: number
  /** The release's own name, e.g. `Shop API 1.2.1 - RC1`; its tag's name when it has none. */
  name: string
  tagName: string
  commitSha: string | null
  author: string | null
  releasedAt: string | null
}

export interface GitlabMergeRequestRecord {
  projectId: number
  iid: number
  title: string
  /** Markdown, as its author wrote it; '' when none. */
  description: string
  sourceBranch: string
  targetBranch: string
  /** `opened`, `merged`, `closed` or `locked`. */
  state: string
  webUrl: string
  /** The merge commit it made on the target branch; null when none (yet, or fast-forward). */
  mergeCommitSha: string | null
  squashCommitSha: string | null
  mergedAt: string | null
  /** Usernames. */
  author: string | null
  mergedBy: string | null
}

export interface GitlabTagRecord {
  projectId: number
  name: string
  commitSha: string
  /** The tag's own time, else its commit's. */
  createdAt: string | null
}

export interface GitlabCommitRecord {
  sha: string
  message: string
}

export interface GitlabPipelineRecord {
  projectId: number
  id: number
  /** The branch or tag it ran for. */
  ref: string
  /** True when `ref` is a tag. */
  tag: boolean
  sha: string
  /** What started it: `push`, `merge_request_event`, `api`, `parent_pipeline`, … */
  source: string
  /** `running`, `success`, `failed`, `canceled`, … */
  status: string
  createdAt: string | null
  /** null while it runs. */
  finishedAt: string | null
  webUrl: string | null
  /** The username of who started it. */
  user: string | null
}

export interface RawPipeline {
  id: number
  ref: string
  tag?: boolean
  sha: string
  source?: string
  status?: string
  created_at?: string
  finished_at?: string | null
  web_url?: string
  user?: RawUser | null
}

export interface RawTag {
  name: string
  commit?: { id: string; created_at?: string | null }
  created_at?: string | null
}

export interface GitlabSource {
  listEnvironments: (
    projectId: number,
    opts?: { states?: Array<string> },
  ) => Promise<Array<GitlabEnvironmentRecord>>
  latestDeployments: (
    projectId: number,
    opts?: {
      status?: string
      jobNames?: (name: string) => boolean
      /** Only deployments updated after this; older environments are left out. */
      updatedAfter?: Date
      /**
       * Read at most this many pages (newest first) and keep what they hold:
       * for statuses so frequent that only the latest rows matter.
       */
      pageLimit?: number
    },
  ) => Promise<Array<GitlabDeploymentRecord>>
  /** One environment with its last deployment (the list endpoint has neither). */
  getEnvironment: (
    projectId: number,
    environmentId: number,
  ) => Promise<{
    environment: GitlabEnvironmentRecord
    lastDeployment: GitlabDeploymentRecord | null
  }>
  /**
   * Without `stopAt`: one request of at most `limit`. With it: newest
   * released first, stopping before the release of tag `stopAt`; at most
   * `maxPages` (default 3) pages.
   */
  listReleases: (
    projectId: number,
    opts?: { limit?: number; stopAt?: string; maxPages?: number },
  ) => Promise<Array<GitlabReleaseRecord>>
  /** Newest first (order_by=updated), stopping before `stopAt`; at most `maxPages` (default 3) pages. */
  listTags: (
    projectId: number,
    opts?: { stopAt?: string; maxPages?: number },
  ) => Promise<Array<GitlabTagRecord>>
  /**
   * The tags whose name matches `search` (GitLab's syntax: `^x` begins,
   * `x$` ends), newest first.
   */
  searchTags: (
    projectId: number,
    search: string,
  ) => Promise<Array<{ name: string; commitSha: string | null }>>
  /** A file's text at a ref or commit; null when it does not exist there. */
  rawFile: (
    projectId: number,
    path: string,
    ref: string,
  ) => Promise<string | null>
  /**
   * One pipeline by id; null when GitLab has none. A pipeline's ref and
   * commit never change, so a caller may keep the answer forever.
   */
  getPipeline: (
    projectId: number,
    id: number,
  ) => Promise<GitlabPipelineRecord | null>
  /** One merge request by its number in the project; null when GitLab has none. */
  getMergeRequest: (
    projectId: number,
    iid: number,
  ) => Promise<GitlabMergeRequestRecord | null>
  /** A merge request's commits, newest first: one page of at most `limit`. */
  mergeRequestCommits: (
    projectId: number,
    iid: number,
    opts?: { limit?: number },
  ) => Promise<Array<GitlabCommitRecord>>
  /**
   * The merge requests a commit belongs to, including the one whose merge
   * commit it is; none for a commit GitLab does not know.
   */
  commitMergeRequests: (
    projectId: number,
    sha: string,
  ) => Promise<Array<GitlabMergeRequestRecord>>
}

// Raw GitLab API response types (minimal shapes)
export interface RawEnvironment {
  id: number
  name: string
  tier?: string
  external_url?: string
  state: string
  last_deployment?: Omit<RawDeployment, 'environment'> & { created_at: string }
}

export interface RawDeployment {
  id: number
  ref: string
  sha: string
  status: string
  created_at?: string
  updated_at: string
  environment: {
    name: string
  }
  deployable?: {
    name: string
    /** True when the deployed ref is a tag; the deployment itself has no such field. */
    tag?: boolean
    commit?: { committed_date?: string }
    pipeline?: {
      id: number
      created_at?: string
      web_url?: string
    }
    started_at?: string
    finished_at?: string
    web_url?: string
    user?: RawUser
  }
  user?: RawUser
}

export interface RawMergeRequest {
  iid: number
  title: string
  description?: string | null
  source_branch: string
  target_branch: string
  state: string
  web_url: string
  merge_commit_sha?: string | null
  squash_commit_sha?: string | null
  merged_at?: string | null
  author?: RawUser | null
  merged_by?: RawUser | null
}

export interface RawCommit {
  id: string
  message: string
}

export interface RawUser {
  username: string
  name?: string
  avatar_url?: string | null
  public_email?: string | null
}

export interface RawRelease {
  name?: string | null
  tag_name: string
  commit?: {
    id: string
  }
  author?: {
    username: string
  }
  released_at?: string
}
