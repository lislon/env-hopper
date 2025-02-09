import type {
  BaseAutoCompleteItemRender,
  EhPluginResouceJumpCtx,
} from '~/modules/pluginCore/types';
import type { ResourceJumpItem } from '~/modules/resourceJump/types';
import type {
  PluginPageUrlAutocompleteItem
} from './pageUrlTypes';

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
      item?.parent?.displayName.toLowerCase().includes(needle.toLowerCase())
    )
  })
}

export function autocompleteToString(
  item: PluginPageUrlAutocompleteItem,
): string {
  return formatJumpButtonTitle(item)
  // return item.displayName;
}

export function formatJumpButtonTitle(
  item: PluginPageUrlAutocompleteItem,
): string {
  if (item?.parent?.displayName) {
    if (item.parent && item.parent.hasSingleChild) {
      return item.parent.displayName
    }

    return `${item.parent.displayName} :: ${item.displayName}`
  }
  return item.displayName
}

export function getJumpUrl(
  jumpResource: ResourceJumpItem | undefined,
  ctx: EhPluginResouceJumpCtx,
): string {
  console.log('jump Url', jumpResource, ctx)

    if (!jumpResource) {
      return ''
    }
    return `https://${jumpResource.slug}.ru`
}
