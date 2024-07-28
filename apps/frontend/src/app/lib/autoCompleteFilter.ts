import { EhAutoCompleteFilter, Item } from '../ui/EhAutoComplete';
import { sortBy } from 'lodash';

export interface SearchableItem {
  title: string;
}

function tokenize(text: string): string[] {
  const camelCaseSecondaryWords = [...text.matchAll(/(?<=[a-z])[A-Z]\w+/g)].map(
    (x) => x[0].toLowerCase()
  );
  const primary = [...text.matchAll(/([a-z]+|[0-9]+)/gi)].map((x) =>
    x[0].toLowerCase()
  );
  return [...camelCaseSecondaryWords, ...primary];
}

export function makeAutoCompleteFilter(items: Item[]): EhAutoCompleteFilter {
  const itemsIndex = items.map((item) => {
    const lower = item.title.toLowerCase();
    return {
      title: lower,
      tokens: tokenize(item.title),
      notFavorite: !item.favorite,
      item,
    };
  });

  return (searchPatternOrig: string) => {
    const searchPattern = searchPatternOrig.toLowerCase();
    const results = new Set<Item>();

    const prefixMatch = itemsIndex.filter((item) =>
      item.title.startsWith(searchPattern)
    );
    const prefixMatchSorted = sortBy(prefixMatch, [
      'notFavorite',
      (x) => x.title.length,
    ]);

    prefixMatchSorted.forEach((x) => results.add(x.item));

    const searchTokens = tokenize(searchPattern);

    itemsIndex
      .filter((item) => {
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
          item.tokens
        );
        return isFound !== false;
      })
      .forEach((x) => results.add(x.item));
    return [...results];
  };
}
