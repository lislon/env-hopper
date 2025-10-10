import type {
  AvailabilityMatrixData,
  BootstrapConfigData,
  ResourceJumpsData,
} from '../common/dataRootTypes'
import type { EhAppIndexed } from '../common/app/appTypes'
import type {
  EhAppPageIndexed,
  EhAppUiIndexed,
} from '../common/app/ui/appUiTypes'
import type {
  EhBackendCredentialInput,
  EhBackendUiDefaultsInput,
} from './common'
import type { EhBackendDataSourceInput } from './dataSources'

export interface EhBackendVersionsRequestParams {
  envNames: Array<string>
  appNames: Array<string>
}

export interface EhBackendVersionsReturn {
  envIds: Array<string>
  appIds: Array<string>
}

export interface EhBackendPageInput extends EhAppPageIndexed {
  slug: string
  title?: string
  url: string
  credentialsRefs?: Array<string>
}

export interface EhBackendAppUIBaseInput {
  credentials?: Array<EhBackendCredentialInput>
  defaults?: EhBackendUiDefaultsInput
}

export interface EhBackendAppUIInput
  extends EhBackendAppUIBaseInput,
    EhAppUiIndexed {
  pages: Array<EhBackendPageInput>
}

export interface EhBackendTagsDescriptionDataIndexed {
  descriptions: Array<EhBackendTagDescriptionDataIndexed>
}

export interface EhBackendTagDescriptionDataIndexed {
  tagKey: string
  displayName?: string
  fixedTagValues?: Array<EhBackendTagFixedTagValue>
}

export interface EhBackendTagFixedTagValue {
  tagValue: string
  displayName: string
}

export interface EhBackendAppInput extends EhAppIndexed {
  ui?: EhBackendAppUIInput
  dataSources?: Array<EhBackendDataSourceInput>
}

export interface EhContextIndexed {
  slug: string
  displayName: string
  /**
   * The value is shared across envs (By default: false)
   */
  isSharedAcrossEnvs?: boolean
  defaultFixedValues?: Array<string>
}
export type EhBackendAppDto = EhAppIndexed

export interface EhAppsMeta {
  defaultIcon?: string
  tags: EhBackendTagsDescriptionDataIndexed
}

export interface RenameRuleParams {
  envSlug?: string
  resourceSlug?: string
}

export interface RenameRule {
  type: 'resourceRename' | 'envRename'
  oldSlug: string
  targetSlug: string
}

export interface EhBackendCompanySpecificBackend {
  getBootstrapData: () => Promise<BootstrapConfigData>
  getAvailabilityMatrix: () => Promise<AvailabilityMatrixData>
  getNameMigrations: (params: RenameRuleParams) => Promise<RenameRule | false>
  getResourceJumps: () => Promise<ResourceJumpsData>
}
