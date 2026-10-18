import type {
  BootstrapConfigData,
  ResourceJumpsData,
  ResourceJumpsExtendedData,
} from '../common/dataRootTypes'
import type { RenameRule, RenameRuleParams } from './api'

export interface EhBackendCompanySpecificBackend {
  getBootstrapData: () => Promise<BootstrapConfigData>
  getNameMigrations: (params: RenameRuleParams) => Promise<RenameRule | false>
  getResourceJumps: () => Promise<ResourceJumpsData>
  getResourceJumpsExtended: () => Promise<ResourceJumpsExtendedData>
}
