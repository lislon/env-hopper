import type { EhAppsMeta, EhContextIndexed } from '../backend/api.js'
import type { EhEnvIndexed } from './env/envTypes.js'
import type { EhAppIndexed } from './app/appTypes.js'

export type JumpResouceSlug = string
export type EnvSlug = string

export interface BootstrapConfigData {
  envs: Record<EnvSlug, EhEnvIndexed>
  apps: Record<string, EhAppIndexed>
  appsMeta: EhAppsMeta
  contexts: Array<EhContextIndexed>
  defaults: {
    envSlug: EnvSlug
    resourceJumpSlug: JumpResouceSlug
  }
}

export interface AvailiabilityMatrixData {
  envSlugs: Array<EnvSlug>
  resourceJumpSlugs: Array<JumpResouceSlug>
  availabilityVariants: Array<AvailabilityVariant>
  matrix: Array<Array<number>>
}

export interface AvailabilityVariant {
  isDeployed: boolean
  isHealthy?: boolean
  hasData?: boolean
}

export interface ResourceJumpsData {
  // key - jump Resouce
  baseResouceJumpUrls: Record<JumpResouceSlug, string>
  resourceJumpsData: Record<JumpResouceSlug, Record<string, string>>
  envData: Record<EnvSlug, Record<string, string>>
  overrideResoucesJumpsUrls: Record<EnvSlug, Record<JumpResouceSlug, string>>
}
