import type { DefaultWithOverridesAndTemplate } from '@env-hopper/shared-core'
import type { EhAppsMeta, EhContextIndexed } from '../backend/api.js'
import type { EhAppIndexed } from './app/appTypes.js'
import type { EhEnvIndexed } from './env/envTypes.js'

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

export type ResourceJumpMetaInfo = Record<string, string>

export interface Sluggable {
  slug: string
}

export interface DisplayNamable {
  displayName: string
}

export interface SlugAndDisplayable extends Sluggable, DisplayNamable {
  slug: string
  displayName: string
}

export interface EnvBaseInfo extends SlugAndDisplayable {
  slug: string
  displayName: string
  templateParams?: Record<string, string>
}

export interface LateResolvableParam extends SlugAndDisplayable {
  slug: string
  displayName: string
}

export interface ResourceJump extends SlugAndDisplayable {
  slug: string
  displayName: string
  urlTemplate: DefaultWithOverridesAndTemplate
  lateResolvableParamSlugs?: Array<string>
}

export interface ResourceJumpGroup {
  slug: string
  displayName: string
  resourceSlugs: Array<string> // First item is primary, rest are children
}

export interface ResourceJumpsData {
  resourceJumps: Array<ResourceJump>
  envs: Array<EnvBaseInfo>
  lateResolvableParams: Array<LateResolvableParam>
  groups?: Array<ResourceJumpGroup>
}

export interface ResourceJumpsExtendedData {
  // resourceJumps: Array<Pick<ResourceJump, 'slug'>>
  envs: Array<EnvInfoExtended>
  // groups?: Array<ResourceJumpGroup>
}

export interface EnvInfoExtended extends Sluggable {
  slug: string
  description?: string
  owner?: User
}

// export interface ResourceJumpExtended extends Sluggable {
//   slug: string
//   description?: string;
//   owner?: User;
// }

export interface User {
  id: string
  displayName: string
}
