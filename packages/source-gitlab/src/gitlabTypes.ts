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
  finishedAt: string | null
  /** Who triggered the deploy, as GitLab knows them. */
  user: GitlabUserRecord | null
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
  tagName: string
  commitSha: string | null
  author: string | null
  releasedAt: string | null
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
  listReleases: (
    projectId: number,
    opts?: { limit?: number },
  ) => Promise<Array<GitlabReleaseRecord>>
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
    finished_at?: string
  }
  user?: {
    username: string
    name?: string
    avatar_url?: string | null
    public_email?: string | null
  }
}

export interface RawRelease {
  tag_name: string
  commit?: {
    id: string
  }
  author?: {
    username: string
  }
  released_at?: string
}
