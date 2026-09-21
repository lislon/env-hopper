import type { DefaultWithOverridesAndTemplate } from '@env-hopper/shared-core'

/**
 * The previous UI's domain vocabulary.
 *
 * These used to live in a standalone `types` package that the previous backend
 * and frontend shared. That package is gone, and the current backend speaks a
 * different vocabulary, so the names live here and `adapter/legacyApi` is the
 * only place that maps one onto the other. Ported components import from here
 * and stay unaware of the current data model.
 *
 * INTENTIONAL DIFFS from the original declarations, each because the current
 * backend has no equivalent field:
 *  - `EhApp.url` (a bare string carrying `{{...}}` placeholders) is replaced by
 *    `urlTemplate`, the current per-environment template object. `lib/utils`
 *    resolves it, so every caller is unchanged.
 *  - `EhEnv.appOverride` is dropped: the same "this environment is different"
 *    need is served by `urlTemplate.overrides`, which the resolver already
 *    honours, so no component has to merge anything by hand.
 *  - `EhEnv.envType` is kept but never populated, so the sensitive-data masking
 *    it gated is currently always off. Restoring it needs a backend field.
 */
export type EhEnvId = string
export type EhAppId = string
export type EhSubstitutionId = string

export type EhMetaDictionary = Record<string, string>

export interface EhApp {
  id: EhAppId
  urlTemplate: DefaultWithOverridesAndTemplate
  abbr?: string
  appTitle?: string
  pageTitle?: string
  meta?: EhMetaDictionary
}

export interface EhEnv {
  id: EhEnvId
  meta?: EhMetaDictionary
  /** The current backend's name for what the previous one called `meta`. */
  templateParams?: EhMetaDictionary
  envType?: 'prod' | string
}

export interface EhSubstitutionType {
  id: EhSubstitutionId
  title: string
  isBrowserAutocomplete?: boolean
  isSharedAcrossEnvs?: boolean
}

export interface EhClientConfig {
  envs: Array<EhEnv>
  apps: Array<EhApp>
  substitutions: Array<EhSubstitutionType>
}

export type EhLastUsedSubs = Record<EhSubstitutionId, string>

export interface EhSubstitutionValue {
  name: EhSubstitutionId
  value: string
}

export interface EhJumpHistory {
  app?: EhAppId
  env?: EhEnvId
  substitution?: string
  url: string
}

export interface EhJumpParams {
  app?: EhApp
  env?: EhEnv
  substitution?: EhSubstitutionValue
}

export type ComboBoxType = 'environments' | 'applications' | 'substitutions'
export type FavoriteOrRecent = 'favorite' | 'recent'

export interface EhEnvAppSubSelectedState {
  envId?: EhEnvId
  appId?: EhAppId
  subValue?: string
}
