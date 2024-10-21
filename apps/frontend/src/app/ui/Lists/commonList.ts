import { SourceItem } from '../AutoComplete/common';
import {
  flatmapToItemsWithSections,
  SectionedItem,
} from '../AutoComplete/section-splitting';
import { sortBy } from 'lodash';
import { EhSubstitutionId } from '@env-hopper/types';

export const AUTOCOMPLETE_ATTENTION_CLASSNAME =
  'relative before:block before:absolute before:-inset-3 before:border-4 before:border-accent before:rounded before:transition before:duration-150';

export function mapToSectionedItems(
  collection: SourceItem[],
  activeSubId: EhSubstitutionId | undefined,
): SectionedItem[] {
  return flatmapToItemsWithSections(sortBy(collection, 'title'), activeSubId);
}
