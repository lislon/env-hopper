import type {
  BaseAutoCompleteItemRender,
} from '~/modules/pluginCore/types'
import type { ResourceJumpUI } from '~/modules/resourceJump/types'
import { formatResourceTitle } from '~/modules/resourceJump/utils/helpers'
import type { PluginPageUrlAutocompleteItem } from './pageUrlTypes'

export function isAutocompleteItem(
  item: { type?: string } | null | undefined,
): item is PluginPageUrlAutocompleteItem {
  return item?.type === 'pageUrl'
}

export function getRenderData(
  item: PluginPageUrlAutocompleteItem,
): BaseAutoCompleteItemRender {
  return {
    displayName: item.displayName,
    parentDisplayName: item.parent?.displayName,
    isDefaultGroupItem: item.slug.endsWith('-home'),
  }
}

export function autocompleteFilter(
  items: Array<PluginPageUrlAutocompleteItem>,
  needle: string,
): Array<PluginPageUrlAutocompleteItem> {
  return items.filter((item) => {
    return (
      item.displayName.toLowerCase().includes(needle.toLowerCase()) ||
      (item.parent &&
        item.parent.displayName.toLowerCase().includes(needle.toLowerCase()))
    )
  })
}

export function formatJumpButtonTitle(
  item: ResourceJumpUI,
): string {
  return formatResourceTitle(item)
}
