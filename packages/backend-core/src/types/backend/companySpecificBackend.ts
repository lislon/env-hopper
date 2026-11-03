import type {
  BootstrapConfigData,
  ResourceJumpsData,
  ResourceJumpsExtendedData,
} from '../common/dataRootTypes'
import type { RenameRule, RenameRuleParams } from './api'
import type {
  ReleaseLine,
  ReleaseTrain,
  ReleaseTrainBuild,
  ReleaseTrains,
} from './releaseTrains'

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
   * Where each planned train's code is built from now, and that line's newest
   * build, by train id; a train left out has none. Asked after the trains are
   * shown: it may read slow sources (a CI server) that the trains need not wait for.
   */
  getReleaseLines?: (input: {
    appSlug: string
    trains: Array<ReleaseTrain>
  }) => Promise<
    Record<string, { releaseLine: ReleaseLine; tip?: ReleaseTrainBuild }>
  >
  /**
   * For each commit, how far it is behind the tip of `ref` (a branch, or a
   * commit), as the backend counts it (e.g. merges on the branch's main line
   * since): 0 is the tip. A commit off the branch counts from where it forked.
   * One answer per call, however many commits: one read per row would not
   * survive a CI server's rate limit. A commit it cannot place is left out.
   */
  getCommitsBehind?: (input: {
    appSlug: string
    ref: string
    commitShas: Array<string>
  }) => Promise<Record<string, number>>
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
