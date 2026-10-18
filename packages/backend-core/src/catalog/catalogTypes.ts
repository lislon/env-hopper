export type HealthState = 'healthy' | 'degraded' | 'down' | 'unknown'
export type EndpointKind = 'ui' | 'api' | 'docs' | 'health' | 'other'
export type CatalogMeta = Record<string, string>

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
export interface CatalogArtifactInput {
  componentSlug: string
  version: string
  aliases?: Array<string>
  releaseKey?: string
  builtAt?: Date
  /** Where the build can be inspected, e.g. its CI pipeline. */
  buildUrl?: string
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
