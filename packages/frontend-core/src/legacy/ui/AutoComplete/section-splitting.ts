import { SourceItem } from './common'
import { EhSubstitutionId } from '../../types'

export type ItemSection = 'favorite' | 'recent' | 'all' | 'same_substitution'

export interface SectionedItem extends SourceItem {
  section: ItemSection
}

/**
 * Section order, previously four chained comparators that each pushed one
 * section to the front. A rank plus a stable sort is the same ordering.
 */
const SECTION_ORDER: Record<ItemSection, number> = {
  recent: 0,
  favorite: 1,
  same_substitution: 2,
  all: 3,
}

export function flatmapToItemsWithSections(
  item: SourceItem[],
  activeSubId: EhSubstitutionId | undefined,
): SectionedItem[] {
  return item
    .flatMap((i) => spreadItemOnSections(i, activeSubId))
    .sort((a, b) => SECTION_ORDER[a.section] - SECTION_ORDER[b.section])
}

/**
 * If the app is in the favorite and recent list, we want to show it in both sections.
 */
export function spreadItemOnSections(
  item: SourceItem | null,
  activeSubId: EhSubstitutionId | undefined,
): SectionedItem[] {
  if (item === null) {
    return []
  }

  // TODO: Do not copy
  const result: SectionedItem[] = [{ ...item, section: 'all' }]

  if (item.favorite) {
    result.push({ ...item, section: 'favorite' })
  }
  if (item.recent) {
    result.push({ ...item, section: 'recent' })
  }
  if (activeSubId !== undefined && item.substitutionId === activeSubId) {
    result.push({ ...item, section: 'same_substitution' })
  }

  return result
}
