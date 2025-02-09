import type {
  BootstrapConfigData,
  EhEnvIndexed,
} from '@env-hopper/backend-core'
import type { PluginPageUrlAutocompleteItem } from '~/plugins/builtin/pageUrl/pageUrlTypes'

export interface PluginAsyncData<T> {
  pluginName: string
  data: T
  isLoaded: boolean
}

export interface EhPluginResourceJumpable extends EhPlugin {
  factoryPageJumpAutocompleteItems: (
    ctx: EhPluginResouceJumpFactoryCtx,
  ) => Array<PluginPageUrlAutocompleteItem>
}

export interface EhPlugin {
  name: PluginName;
  // populatePageJumpItems(): Promise<ResouceJumpItem[]>
}

export function isEhPluginResourceJumpable(
  plugin: EhPlugin,
): plugin is EhPluginResourceJumpable {
  return 'factoryPageJumpAutocompleteItems' in plugin
}
export interface BaseAppAutoCompletableParent {
  type: string
  displayName: string
  hasSingleChild: boolean
}
export interface BaseAutoCompletableItem {
  type: string
  slug: string
  parent?: BaseAppAutoCompletableParent
}

export interface BaseAutoCompleteItemRender {
  displayName: string
  parentDisplayName?: string
  isDefaultGroupItem?: boolean
}

export interface EhPluginResouceJumpFactoryCtx {
  bootstrapConfig: BootstrapConfigData
}

export interface EhPluginResouceJumpCtx {
  env: EhEnvIndexed | undefined
}

export type PluginName = string;