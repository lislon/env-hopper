import { EhAutoCompleteFilter } from '../ui/AutoComplete/EhAutoComplete';
import { sortBy } from 'lodash';
import { Item } from '../ui/AutoComplete/common';

function tokenize(text: string): string[] {
  const camelCaseSecondaryWords = [...text.matchAll(/(?<=[a-z])[A-Z]\w+/g)].map(
    (x) => x[0].toLowerCase(),
  );
  const primary = [...text.matchAll(/([a-z]+|[0-9]+)/gi)].map((x) =>
    x[0].toLowerCase(),
  );

  const leadingZeros = (input: string) => {
    const match = input.match(/^0+(.+)/);
    return match ? [input, match[1]] : [input];
  };

  return [...camelCaseSecondaryWords, ...primary].flatMap(leadingZeros);
}

export function makeAutoCompleteFilter(items: Item[]): EhAutoCompleteFilter {
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

  return (searchPatternOrig: string) => {
    const searchPattern = searchPatternOrig.toLowerCase();
    const results = new Set<Item>();

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
  };
}
