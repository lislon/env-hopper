import { EhAutoCompleteFilter } from '../../ui/AutoComplete/EhAutoComplete';
import { sortBy } from 'lodash';
import { SourceItem } from '../../ui/AutoComplete/common';
import { fixRuLayout, isRuLayout } from '../fixLayout';
import { tokenize } from './tokenize';

export function makeAutoCompleteFilter(
  items: SourceItem[],
): EhAutoCompleteFilter {
  const itemsIndex = items.map((item) => {
    const lower = item.title.toLowerCase();
    return {
      title: lower,
      titleOrig: item.title,
      tokens: tokenize(item.title),
      notFavorite: !item.favorite,
      item,
    };
  });

  function doSearch(searchPatternOrig: string) {
    const searchPattern = searchPatternOrig.toLowerCase();
    const results = new Set<SourceItem>();

    // prefix match exact case sensitive
    const exactPrefix = sortBy(
      itemsIndex.filter((item) => item.titleOrig.startsWith(searchPatternOrig)),
      (x) => x.title.length,
    );
    exactPrefix.forEach((x) => results.add(x.item));

    // prefix case insensitive
    const caseRelaxedPrefix = sortBy(
      itemsIndex.filter((item) => item.title.startsWith(searchPattern)),
      ['notFavorite', (x) => x.title.length],
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

      sortBy(prefixedInTokens, (x) => x.title.length).forEach((x) =>
        results.add(x.item),
      );
    }

    // substring match (case sensitive)
    const exactSubstring = sortBy(
      itemsIndex.filter((item) => item.titleOrig.includes(searchPatternOrig)),
      (x) => x.titleOrig.indexOf(searchPatternOrig),
    );
    exactSubstring.forEach((x) => results.add(x.item));

    // substring match (case insensitive)
    const relaxSubstring = sortBy(
      itemsIndex.filter((item) => item.title.includes(searchPattern)),
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
