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
 *  - `EhEnv.appOverride` is kept. `urlTemplate.overrides` covers the jump url
 *    only; the override also restates the app's own `meta` and can declare that
 *    an app facility does not exist here, and both are visible in the widgets
 *    and the link list rather than in the url.
 *  - `EhEnv.envType` is kept and read off the bootstrap environment entry, so
 *    the sensitive-data masking it gates works as it did.
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
  widgets?: EhAppWidgets
}

/**
 * What the credential widgets beside the form read.
 *
 * `null` means "this environment has none", as distinct from `undefined`, "the
 * app never had one". Both hide the widget; the difference matters only when an
 * environment override is merged over an app that does have one.
 */
export interface EhAppWidgets {
  ui?: EhAppWidgetUiCredsOne | EhAppWidgetUiCredsMany | null
  db?: EhAppWidgetDbCreds | null
}

/** A hint to the user about which username and password the app UI takes. */
export interface EhAppWidgetUiCredsOne {
  label?: string
  desc?: string
  username: string
  password: string
}

export type EhAppWidgetUiCredsMany = Array<EhAppWidgetUiCredsOne>

export interface EhAppWidgetDbCreds {
  url: string
  username: string
  password: string
}

/** How every app differs on this environment. */
export interface EhAppOverride {
  meta?: EhMetaDictionary
  widgets?: EhAppWidgets
}

export interface EhEnv {
  id: EhEnvId
  meta?: EhMetaDictionary
  /** The current backend's name for what the previous one called `meta`. */
  templateParams?: EhMetaDictionary
  appOverride?: EhAppOverride
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
