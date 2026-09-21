import { SourceItem } from './common';
import { sortBy } from 'lodash';
import { EhSubstitutionId } from '@env-hopper/types';

export type ItemSection = 'favorite' | 'recent' | 'all' | 'same_substitution';

export interface SectionedItem extends SourceItem {
  section: ItemSection;
}

export function flatmapToItemsWithSections(
  item: SourceItem[],
  activeSubId: EhSubstitutionId | undefined,
): SectionedItem[] {
  return sortBy(
    item.flatMap((i) => spreadItemOnSections(i, activeSubId)),
    [
      (item) => (item.section === 'recent' ? -1 : 1),
      (item) => (item.section === 'favorite' ? -1 : 1),
      (item) => (item.section === 'same_substitution' ? -1 : 1),
      (item) => (item.section === 'all' ? -1 : 1),
    ],
  );
}

/**
 * If the app is in the favorite and recent list, we want to show it in both sections.
 */
export function spreadItemOnSections(
  item: SourceItem | null,
  activeSubId: EhSubstitutionId | undefined,
): SectionedItem[] {
  if (item === null) {
    return [];
  }

  // TODO: Do not copy
  const result: SectionedItem[] = [{ ...item, section: 'all' }];

  if (item.favorite) {
    result.push({ ...item, section: 'favorite' });
  }
  if (item.recent) {
    result.push({ ...item, section: 'recent' });
  }
  if (activeSubId !== undefined && item.substitutionId === activeSubId) {
    result.push({ ...item, section: 'same_substitution' });
  }

  return result;
}
