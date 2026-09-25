import type { EhMetaDictionary } from '../sharedTypes'

/** An app facility that an environment can declare it does not have. */
export type EhAppFacility = 'credentials' | 'dataSources'

/**
 * How every app differs on one environment.
 *
 * This is not the same thing as a per-environment url override. A url override
 * says where to go; this says what the app's own values ARE there, and the
 * difference shows up in everything built from them — credentials, database
 * urls, links — not only in the jump.
 *
 * It applies to every app rather than to a named one: an environment that is
 * built differently is built differently for all of them, which is why the
 * keys are the app-meta keys and not app slugs.
 */
export interface EhEnvAppOverride {
  /** Merged over each app's own `meta`, key by key. */
  meta?: EhMetaDictionary
  /**
   * Facilities that do not exist here, so nothing should be shown for them.
   *
   * Without this, a facility whose value is a pattern over environment values
   * the environment does not define renders that pattern instead — a database
   * host with a `{{...}}` left in it is worse than no database host.
   */
  unavailable?: Array<EhAppFacility>
}

/**
 * What kind of environment this is. `prod` is the one the UI treats
 * differently: sensitive values are masked until the user asks for them.
 */
export type EhEnvType = 'prod' | 'stage'

export interface EhEnvIndexed {
  slug: string
  displayName: string
  meta?: EhMetaDictionary
  envType?: EhEnvType
  appOverride?: EhEnvAppOverride
}
