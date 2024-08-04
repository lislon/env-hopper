import { Item } from './common';

export type ItemSection = 'favorite' | 'recent' | 'all';

export interface ItemWithSection extends Item {
  section: ItemSection;
}

export function flatmapToItemsWithSections(
  item: Item[],
  isUserSearching: boolean
): ItemWithSection[] {
  return item.flatMap((i) => mapToItemWithSection(i, isUserSearching));
}

/**
 * If the app is in the favorite and recent list, we want to show it in both sections.
 * @param item - the item to map
 * @param isUserSearching - true if autocomplete now has user filter. In this case, we want to show only one item.
 */
export function mapToItemWithSection(
  item: Item | null,
  isUserSearching: boolean
): ItemWithSection[] {
  if (item === null) {
    return [];
  }

  if (item.favorite && item.recent) {
    if (isUserSearching) {
      return [{ ...item, section: 'recent' }];
    }

    return [
      { ...item, section: 'recent' },
      { ...item, section: 'favorite' },
      { ...item, section: 'all' },
    ];
  }
  if (isUserSearching) {
    return [
      {
        ...item,
        section: item.recent ? 'recent' : item.favorite ? 'favorite' : 'all',
      },
    ];
  }
  if (item.favorite) {
    return [
      { ...item, section: 'favorite' },
      { ...item, section: 'all' },
    ];
  }
  if (item.recent) {
    return [
      { ...item, section: 'recent' },
      { ...item, section: 'all' },
    ];
  }

  return [{ ...item, section: 'all' }];
}
