export interface PluginAsyncData<T> {
  pluginName: string
  data: T
  isLoaded: boolean
}

export interface EhPlugin {
  name: PluginName
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

export type PluginName = string
