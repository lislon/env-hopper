import type {
  BootstrapConfigData,
  ResourceJumpsData,
  ResourceJumpsExtendedData,
} from '../common/dataRootTypes'
import type { RenameRule, RenameRuleParams } from './api'

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
}
