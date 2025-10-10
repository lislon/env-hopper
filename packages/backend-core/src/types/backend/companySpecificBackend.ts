import type {
  AvailabilityMatrixData,
  BootstrapConfigData,
  ResourceJumpsData,
} from '../common/dataRootTypes'
import type { RenameRule, RenameRuleParams } from './api'

export interface EhBackendCompanySpecificBackend {
  getBootstrapData: () => Promise<BootstrapConfigData>
  getAvailabilityMatrix: () => Promise<AvailabilityMatrixData>
  getNameMigrations: (params: RenameRuleParams) => Promise<RenameRule | false>
  getResourceJumps: () => Promise<ResourceJumpsData>
}
