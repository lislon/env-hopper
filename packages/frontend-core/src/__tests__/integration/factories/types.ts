// Note: no server type needed at config stage; server is provided to setupNetwork

// Feature-driven DSL types - minimal config, mapper generates the rest
export type ResourceJumpType = '1-pager' | '2-pager'

export interface FeatureEnvConfig {
  slug: string // e.g., 'dev', 'prod', 'staging'
}

export interface FeatureAppConfig {
  slug: string // e.g., 'app1', 'admin'
  resourceJumps?: ResourceJumpType // Optional: '1-pager' or '2-pager'
}

export interface FeatureBackendConfig {
  apps: Array<FeatureAppConfig>
  envs: Array<FeatureEnvConfig>
}
