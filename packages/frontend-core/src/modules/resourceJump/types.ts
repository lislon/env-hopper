import type { ResourceJumpsData } from '@env-hopper/backend-core'
import type { PluginInterfaceForCore } from '../pluginCore/makePluginManagerContext'

export interface ResouceJumpItemParent {
  type: string
  displayName: string
  hasSingleChild: boolean
}

export interface ResourceJumpItem {
  type: string
  slug: string
  parent?: ResouceJumpItemParent
}

export interface ResourceJumpLoaderReturn {
  envSlug?: string
  resourceSlug?: string
  pluginInterfaceForCore: PluginInterfaceForCore
  resourceJumps: ResourceJumpsData
}
