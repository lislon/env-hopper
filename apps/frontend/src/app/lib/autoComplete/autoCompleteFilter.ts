import { EhAutoCompleteFilter } from '../../ui/AutoComplete/EhAutoComplete';
import { ListIteratee, Many, sortBy } from 'lodash';
import { SourceItem } from '../../ui/AutoComplete/common';
import { fixRuLayout, isRuLayout } from '../fixLayout';
import { tokenize } from './tokenize';

type IndexType = {
  title: string;
  titleOrig: string;
  tokens: string[];
  notFavorite: boolean;
  notRecent: boolean;
  item: SourceItem;
};

export function makeAutoCompleteFilter(
  items: SourceItem[],
): EhAutoCompleteFilter {
  const itemsIndex: IndexType[] = items.map((item) => {
    const lower = item.title.toLowerCase();
    return {
      title: lower,
      titleOrig: item.title,
      tokens: tokenize(item.title),
      notFavorite: !item.favorite,
      notRecent: !item.recent,
      item,
    };
  });
  const recentFavWinSort = ['notFavorite', 'notRecent'];
  const shortestWinSort = (x: IndexType) => x.title.length;
  const sorts: Many<ListIteratee<IndexType>> = [
    ...recentFavWinSort,
    shortestWinSort,
  ];

  function doSearch(searchPatternOrig: string) {
    const searchPattern = searchPatternOrig.toLowerCase();
    const results = new Set<SourceItem>();

    // prefix match exact case sensitive
    const exactPrefix = sortBy(
      itemsIndex.filter((item) => item.titleOrig.startsWith(searchPatternOrig)),
      sorts,
    );
    exactPrefix.forEach((x) => results.add(x.item));

    // prefix case insensitive
    const caseRelaxedPrefix = sortBy(
      itemsIndex.filter((item) => item.title.startsWith(searchPattern)),
      sorts,
    );
    caseRelaxedPrefix.forEach((x) => results.add(x.item));

    // token prefix
    const searchTokens = tokenize(searchPattern);

    if (searchTokens.length > 0) {
      const prefixedInTokens = itemsIndex.filter((item) => {
        const isFound = searchTokens.reduce<string[] | false>(
          (itemTokens, searchToken) => {
            if (itemTokens !== false) {
              for (let i = 0; i < itemTokens.length; i++) {
                if (itemTokens[i].startsWith(searchToken)) {
                  return itemTokens.slice(i + 1);
                }
              }
            }
            return false;
          },
          item.tokens,
        );
        return isFound !== false;
      });

      sortBy(prefixedInTokens, sorts).forEach((x) => results.add(x.item));
    }

    // substring match (case sensitive)
    const exactSubstring = sortBy(
      itemsIndex.filter((item) => item.titleOrig.includes(searchPatternOrig)),
      sorts,
      (x) => x.titleOrig.indexOf(searchPatternOrig),
    );
    exactSubstring.forEach((x) => results.add(x.item));

    // substring match (case insensitive)
    const relaxSubstring = sortBy(
      itemsIndex.filter((item) => item.title.includes(searchPattern)),
      sorts,
      (x) => x.title.indexOf(searchPattern),
    );
    relaxSubstring.forEach((x) => results.add(x.item));

    itemsIndex
      .filter((item) => item.tokens.join('').includes(searchPattern))
      .forEach((x) => results.add(x.item));

    return [...results];
  }

  return (searchPatternOrig: string) => {
    let results = doSearch(searchPatternOrig);
    if (results.length === 0 && isRuLayout(searchPatternOrig)) {
      results = doSearch(fixRuLayout(searchPatternOrig));
    }
    return results;
  };
}
