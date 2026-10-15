export interface GitlabEnvironmentRecord {
  projectId: number
  id: number
  name: string
  tier: string | null
  externalUrl: string | null
  state: string
  lastDeployedAt: string | null
}

export interface GitlabDeploymentRecord {
  projectId: number
  environmentName: string
  ref: string
  sha: string
  tag: boolean
  jobName: string
  pipelineId: number | null
  status: string
  finishedAt: string | null
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
  last_deployment?: {
    created_at: string
  }
}

export interface RawDeployment {
  id: number
  ref: string
  sha: string
  tag?: boolean
  status: string
  updated_at: string
  environment: {
    name: string
  }
  deployable?: {
    name: string
    pipeline?: {
      id: number
    }
    finished_at?: string
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
