export type HealthState = 'healthy' | 'degraded' | 'down' | 'unknown'
export type EndpointKind = 'ui' | 'api' | 'docs' | 'health' | 'other'
export type CatalogMeta = Record<string, string>
export type BuiltAtSource = 'build' | 'deploy'

export interface CatalogEnvironmentInput {
  slug: string
  displayName: string
  description?: string
  meta?: CatalogMeta
}
export interface CatalogAppInput {
  slug: string
  displayName: string
  /** The Component that stands for the App where one Version is shown. */
  leadComponentSlug?: string
}
export interface CatalogComponentInput {
  slug: string
  displayName: string
  appSlug?: string
  externalIds?: CatalogMeta
  /** The page of a commit of its code, with `{{sha}}` where the commit goes. */
  commitUrl?: string
}
export interface CatalogDeploymentTargetInput {
  slug: string
  displayName: string
  environmentSlug?: string
  meta?: CatalogMeta
}
export interface CatalogReleaseInput {
  key: string
  tag?: string
  commitSha?: string
  author?: string
  releasedAt?: Date
}
/**
 * The change request (a merge or pull request) an Artifact was built from,
 * or, for a build of the branch it merged into, the one that merged it.
 */
export interface ChangeRequestRef {
  /** Its number in its project, e.g. `14`. */
  id: string
  url: string
  title?: string
  /** The Work Items it names, e.g. issue keys. */
  workItems?: Array<string>
  /** true: built from the change request itself; false: from the branch it merged into. */
  direct: boolean
}

export interface CatalogArtifactInput {
  componentSlug: string
  version: string
  aliases?: Array<string>
  releaseKey?: string
  builtAt?: Date
  /**
   * Where `builtAt` came from: `build` is the build's own time, `deploy` its
   * first deploy, used when no Source knows the build time.
   */
  builtAtSource?: BuiltAtSource
  /** Where the build can be inspected, e.g. its CI pipeline. */
  buildUrl?: string
  /** The commit the build was made from. */
  commitSha?: string
  /** The change request the build was made from or merged by. */
  changeRequest?: ChangeRequestRef
}
export interface CatalogEndpointInput {
  kind: EndpointKind
  url: string
  label?: string
}
export interface CatalogDeploymentInput {
  componentSlug: string
  targetSlug: string
  version: string
  source: string
  deployedAt?: Date
  /** Username of the User who deployed it; sync the User first. */
  deployedBy?: string
  /** Where the deploy can be inspected, e.g. its CI pipeline. */
  deployUrl?: string
  endpoints?: Array<CatalogEndpointInput>
}
export interface CatalogUserInput {
  username: string
  email?: string
  /** Where the User is known from, e.g. a CI system. */
  provider?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
}
export interface CatalogHealthInput {
  componentSlug: string
  targetSlug: string
  state: HealthState
  observedAt: Date
  checker: string
  detail?: string
}
/** What a deploy run ended as, or that it still runs. */
export type DeployAttemptStatus = 'running' | 'failed' | 'canceled'
/**
 * A deploy run of an Artifact to a Target that has not succeeded, as the
 * Entity Provider chose to show it: at most one per (Component, Target).
 */
export interface CatalogDeployAttemptInput {
  componentSlug: string
  targetSlug: string
  /** Sync its Artifact first. */
  version: string
  status: DeployAttemptStatus
  startedAt?: Date
  endedAt?: Date
  /** Username of the User who started it; sync the User first. */
  by?: string
  /** Where the deploy can be inspected, e.g. its CI pipeline. */
  deployUrl?: string
  /** The deploy job itself. */
  jobUrl?: string
  /** The branch, tag or merge-request ref deployed. */
  ref?: string
}

/** An `envSlug` that writes one freshness for all of an App's Environments; an Environment's own row wins. */
export const ALL_ENVS = '*'

/**
 * How fresh what an App shows on an Environment is, as the Entity Provider
 * last read it (ADR 0006).
 */
export interface AppEnvFreshnessInput {
  appSlug: string
  /** An Environment, or `ALL_ENVS` for each of the App's Environments without a row of its own. */
  envSlug: string
  /** The oldest time any read that serves it was confirmed. */
  checkedAt: Date
  /** The Sources being read for it now. */
  reading?: Array<string>
  /** The last read that failed and has not succeeded since. */
  failed?: { source: string; at: Date }
}
