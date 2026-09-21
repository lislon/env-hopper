import type { SourceItem } from '../AutoComplete/common'
import type { SectionedItem } from '../AutoComplete/section-splitting'
import { flatmapToItemsWithSections } from '../AutoComplete/section-splitting'
import type { EhSubstitutionId } from '../../types'

export const AUTOCOMPLETE_ATTENTION_CLASSNAME =
  'relative before:block before:absolute before:-inset-3 before:border-4 before:border-accent before:rounded before:transition before:duration-150'

export function mapToSectionedItems(
  collection: Array<SourceItem>,
  activeSubId: EhSubstitutionId | undefined,
): Array<SectionedItem> {
  const byTitle = [...collection].sort((a, b) =>
    a.title < b.title ? -1 : a.title > b.title ? 1 : 0,
  )
  return flatmapToItemsWithSections(byTitle, activeSubId)
}
