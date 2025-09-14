import type {
  BaseAppAutoCompletableParent,
  BaseAutoCompletableItem,
} from '~/modules/pluginCore/types'

export interface PluginPageUrlAutoCompletableParent
  extends BaseAppAutoCompletableParent {
  type: 'pageUrlParent'
  displayName: string
  aliases?: Array<string>
}

export interface PluginPageUrlAutocompleteItem extends BaseAutoCompletableItem {
  type: 'pageUrl'
  displayName: string
  parent?: PluginPageUrlAutoCompletableParent
}
