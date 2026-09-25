import type { DefaultWithOverridesAndTemplate } from '@env-hopper/shared-core'
import type { EhAppsMeta, EhContextIndexed } from '../backend/api.js'
import type { EhAppIndexed } from './app/appTypes.js'
import type { EhCustomizationData } from './customizationTypes.js'
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
  /** Absent for a deployment that customizes nothing. */
  customization?: EhCustomizationData
  /**
   * The running server's own version, shown in the header and reported with
   * client errors.
   *
   * It comes from the server rather than from a frontend build define on
   * purpose: a browser holding a cached bundle would otherwise report the
   * version it was built with, which is exactly the case where knowing the
   * deployed version matters.
   */
  appVersion?: string
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
  /**
   * The value stays when the user switches environment. An order id means the
   * same thing everywhere; a session id does not. (By default: false)
   */
  isSharedAcrossEnvs?: boolean
  /**
   * Let the browser suggest the user's earlier values for this param. Worth it
   * for an id someone retypes; wrong for anything sensitive or single-use,
   * since the browser then stores it. (By default: false)
   */
  isBrowserAutocomplete?: boolean
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
