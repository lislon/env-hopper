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
  createdAt?: Date
}
export interface CatalogArtifactInput {
  componentSlug: string
  version: string
  aliases?: Array<string>
  releaseKey?: string
  builtAt?: Date
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
  endpoints?: Array<CatalogEndpointInput>
}
export interface CatalogHealthInput {
  componentSlug: string
  targetSlug: string
  state: HealthState
  observedAt: Date
  checker: string
  detail?: string
}
