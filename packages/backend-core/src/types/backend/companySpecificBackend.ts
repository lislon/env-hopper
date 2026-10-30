import type {
  BootstrapConfigData,
  ResourceJumpsData,
  ResourceJumpsExtendedData,
} from '../common/dataRootTypes'
import type { RenameRule, RenameRuleParams } from './api'
import type { ReleaseTrains } from './releaseTrains'

/**
 * Every request asks again, and `pair` and `slices` ask too: return the same
 * object while the data is unchanged, and a new one when it changes. The core
 * packs each `getBootstrapData` object once and never modifies one.
 */
export interface EhBackendCompanySpecificBackend {
  getBootstrapData: () => Promise<BootstrapConfigData>
  getNameMigrations: (params: RenameRuleParams) => Promise<RenameRule | false>
  getResourceJumps: () => Promise<ResourceJumpsData>
  getResourceJumpsExtended: () => Promise<ResourceJumpsExtendedData>
  /**
   * What a change request says about itself, asked when a person opens it:
   * its description (markdown). Null: not known. Absent: none kept.
   */
  getChangeRequestDetails?: (input: {
    appSlug: string
    componentSlug: string
    id: string
  }) => Promise<{ description: string } | null>
  /**
   * The App's Release Trains as its trackers say, every Release Date kept even
   * when Sources disagree. Null: the App has none configured.
   */
  getReleaseTrains?: (input: {
    appSlug: string
  }) => Promise<ReleaseTrains | null>
  /**
   * Someone looks at these AppEnvs now (`reason`: what they did): read what
   * they show again, if it is older than current. Never awaited.
   */
  warm?: (
    appEnvs: Array<{ appSlug: string; envSlug: string }>,
    reason: string,
  ) => void
  /**
   * What the backend did lately for the diagnostics panel: checks asked,
   * run, run beside a full run, or failed, and why. Served only while the
   * bootstrap's `ui.diagnostics` is on.
   */
  getDiagnostics?: () => Promise<Array<DiagnosticEvent>>
}

/** One thing the backend did, for the diagnostics panel. */
export interface DiagnosticEvent {
  at: string
  kind: string
  /** Made safe for a browser before it is served. */
  detail: string
}
