import type { BaseAutoCompletableItem } from '~/modules/pluginCore/types'

export interface SpecialAutoCompleteItem {
  type: 'special'
  slug: 'specia-all-apps'
}

export function isSpecialAutoCompleteItem(
  item: BaseAutoCompletableItem | SpecialAutoCompleteItem | null | undefined,
): item is SpecialAutoCompleteItem {
  return item?.type === 'special'
}

export type AutoCompleteItem = BaseAutoCompletableItem | SpecialAutoCompleteItem

export interface AppAutoCompleteAmend {
  isChild?: boolean
}

export interface AutoCompleteContext {
  searchString: string
}
