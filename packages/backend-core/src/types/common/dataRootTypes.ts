import type { EhAppsMeta, EhContextIndexed } from '../backend/api.js'
import type { EhEnvIndexed } from './env/envTypes.js'
import type { EhAppIndexed } from './app/appTypes.js'

export type JumpResourceSlug = string
export type EnvSlug = string

export interface BootstrapConfigData {
  envs: Record<EnvSlug, EhEnvIndexed>
  apps: Record<string, EhAppIndexed>
  appsMeta: EhAppsMeta
  contexts: Array<EhContextIndexed>
  defaults: {
    envSlug: EnvSlug
    resourceJumpSlug: JumpResourceSlug
  }
}

export interface AvailabilityMatrixData {
  envSlugs: Array<EnvSlug>
  resourceJumpSlugs: Array<JumpResourceSlug>
  availabilityVariants: Array<AvailabilityVariant>
  matrix: Array<Array<number>>
}

export interface AvailabilityVariant {
  isDeployed: boolean
  isHealthy?: boolean
  hasData?: boolean
}

export interface ResourceJumpsData {
  // key - jump resource
  baseResourceJumpUrls: Record<JumpResourceSlug, string>
  resourceJumpsData: Record<JumpResourceSlug, Record<string, string>>
  envData: Record<EnvSlug, Record<string, string>>
  overrideResourcesJumpsUrls: Record<EnvSlug, Record<JumpResourceSlug, string>>
}
