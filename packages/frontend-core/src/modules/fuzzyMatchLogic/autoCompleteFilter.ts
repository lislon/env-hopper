import { Encoder, Index } from 'flexsearch'
import { matchSorter } from 'match-sorter'
import type {
  FuzzySearchContext,
  FuzzySearchIndex,
  FuzzySearchPrepareIndexParams,
  FuzzySearchReturnItem,
} from './types'
import { fixRuLayout, isRuLayout } from '~/modules/fuzzyMatchLogic/fixLayout'
import {
  enrichTokensForIndex,
  tokenize,
} from '~/modules/fuzzyMatchLogic/tokenize'

export function makeFuzzySearchIndex(
  params: FuzzySearchPrepareIndexParams,
): FuzzySearchIndex {
  const encoder = new Encoder({
    // prepare
    // normalize: true,
    // dedupe: true,
    // include: {
    //   letter: true,
    //   number: true,
    //   symbol: true,
    //   punctuation: true,
    //   control: false,
    // },
    // finalize: (terms) => {
    //   return terms
    // },
  })
  const index = new Index({
    tokenize: 'forward',
    encoder: encoder,
  })
  params.entries.forEach((entry, idx) => {
    const newLocal = [
      ...enrichTokensForIndex(tokenize(entry.displayName)),
      gluer(entry.displayName),
    ].join(' ')
    // index.add(idx, entry.displayName)
    index.add(idx, newLocal)
  })
  return {
    flexIndex: index,
    entries: params.entries,
  }
}

export function fuzzySearch(
  needle: string,
  context: FuzzySearchContext,
): Array<FuzzySearchReturnItem> {
  const justDisplayName = context.index.entries

  const attempt = (n: string) => {
    const tokenizedNeedle = tokenize(n).join(' ')
    const results = matchSorter(justDisplayName, tokenizedNeedle, {
      keys: [(item) => tokenize(item.displayName).join(' ')],
      sorter: (rankedItems) => {
        return rankedItems.sort((a, b) => {
          const aFirst = -1
          const bFirst = 1
          const { rank: aRank, keyIndex: aKeyIndex } = a
          const { rank: bRank, keyIndex: bKeyIndex } = b
          const same = aRank === bRank
          if (same) {
            if (aKeyIndex === bKeyIndex) {
              const aFreq = context.freqGetter?.(a.item.slug) || 0
              const bFreq = context.freqGetter?.(b.item.slug) || 0
              if (aFreq === bFreq) {
                return a.item.displayName.localeCompare(b.item.displayName)
              }

              return aFreq > bFreq ? aFirst : bFirst
            } else {
              return aKeyIndex < bKeyIndex ? aFirst : bFirst
            }
          } else {
            return aRank > bRank ? aFirst : bFirst
          }
        })
        // return sort(rankedItems, (rankedItem) => {
        //   const { rank } = rankedItem
        //   const freq = context.freqGetter?.(rankedItem.item.slug) || 0;
        //   if (rank <= rankings.STARTS_WITH) {
        //     // or worse
        //     return ((10 - rank) * 10000 + freq * 1000 + rankedItem.index)
        //   }
        //   return ((10 - rank) * 100000 + rankedItem.index)
        // }, true)
      },
    })
    return results.map((r) => ({ entry: r }))
  }

  let lastAttempt = attempt(needle)
  if (lastAttempt.length === 0 && isRuLayout(needle)) {
    lastAttempt = attempt(fixRuLayout(needle))
  }
  return lastAttempt

  // const attempt = (n: string) => {
  //   const tokenizedNeedle = tokenize(n)
  //   const postFiltrationResultsRaw = tokenizedNeedle.flatMap((t) =>
  //     context.index.flexIndex.searchCache(t).map((id) => {
  //       return {
  //         id,
  //         entry: context.index.entries[id as number]!,
  //       }
  //     }),
  //   )

  //   const postFiltrationResults = postFiltration(
  //     unique(postFiltrationResultsRaw, (r) => r.id),
  //     n,
  //   )

  //   return score(postFiltrationResults, n)
  // }

  // let lastAttempt = attempt(needle)
  // if (lastAttempt.length === 0 && isRuLayout(needle)) {
  //   lastAttempt = attempt(fixRuLayout(needle))
  // }
  // return lastAttempt

  // const foundTokensByRows = new Map<number, FuzzySearchPreliminaryResult>()

  // tokenizedNeedle.forEach((token) => {
  //   const found = context.index.flexIndex.search(token)
  //   ;(found as number[]).forEach((id) => {
  //     let row = foundTokensByRows.get(id)
  //     if (!row) {
  //       row = {
  //         entry: context.index.entries[id as number]!,
  //         foundTokens: [token],
  //       }
  //       foundTokensByRows.set(id, row)
  //     } else {
  //       row.foundTokens.push(token)
  //     }
  //   })
  // })

  // const rawResults = [...foundTokensByRows.values()]
  // const postFiltrationResults = postFiltration(rawResults)
}

function gluer(displayName: string) {
  return displayName.toLowerCase().replaceAll(/[^a-z0-9]/g, '')
}
// type IndexType = {
//   title: string;
//   titleOrig: string;
//   tokens: string[];
//   notFavorite: boolean;
//   notRecent: boolean;
//   item: SourceItem;
// };

// export function makeAutoCompleteFilter(
//   items: SourceItem[],
// ): EhAutoCompleteFilter {
//   const itemsIndex: IndexType[] = items.map((item) => {
//     const lower = item.title.toLowerCase();
//     return {
//       title: lower,
//       titleOrig: item.title,
//       tokens: tokenize(item.title),
//       notFavorite: !item.favorite,
//       notRecent: !item.recent,
//       item,
//     };
//   });
//   const recentFavWinSort = ['notFavorite', 'notRecent'];
//   const shortestWinSort = (x: IndexType) => x.title.length;
//   const sorts: Many<ListIteratee<IndexType>> = [
//     ...recentFavWinSort,
//     shortestWinSort,
//   ];

//   function doSearch(searchPatternOrig: string) {
//     const searchPattern = searchPatternOrig.toLowerCase();
//     const results = new Set<SourceItem>();

//     // prefix match exact case sensitive
//     const exactPrefix = sortBy(
//       itemsIndex.filter((item) => item.titleOrig.startsWith(searchPatternOrig)),
//       sorts,
//     );
//     exactPrefix.forEach((x) => results.add(x.item));

//     // prefix case insensitive
//     const caseRelaxedPrefix = sortBy(
//       itemsIndex.filter((item) => item.title.startsWith(searchPattern)),
//       sorts,
//     );
//     caseRelaxedPrefix.forEach((x) => results.add(x.item));

//     // token prefix
//     const searchTokens = tokenize(searchPattern);

//     if (searchTokens.length > 0) {
//       const prefixedInTokens = itemsIndex.filter((item) => {
//         const isFound = searchTokens.reduce<string[] | false>(
//           (itemTokens, searchToken) => {
//             if (itemTokens !== false) {
//               for (let i = 0; i < itemTokens.length; i++) {
//                 if (itemTokens[i].startsWith(searchToken)) {
//                   return itemTokens.slice(i + 1);
//                 }
//               }
//             }
//             return false;
//           },
//           item.tokens,
//         );
//         return isFound !== false;
//       });

//       sortBy(prefixedInTokens, sorts).forEach((x) => results.add(x.item));
//     }

//     // substring match (case sensitive)
//     const exactSubstring = sortBy(
//       itemsIndex.filter((item) => item.titleOrig.includes(searchPatternOrig)),
//       sorts,
//       (x) => x.titleOrig.indexOf(searchPatternOrig),
//     );
//     exactSubstring.forEach((x) => results.add(x.item));

//     // substring match (case insensitive)
//     const relaxSubstring = sortBy(
//       itemsIndex.filter((item) => item.title.includes(searchPattern)),
//       sorts,
//       (x) => x.title.indexOf(searchPattern),
//     );
//     relaxSubstring.forEach((x) => results.add(x.item));

//     itemsIndex
//       .filter((item) => item.tokens.join('').includes(searchPattern))
//       .forEach((x) => results.add(x.item));

//     const searchString = searchTokens.join('');
//     itemsIndex
//       .filter((item) => item.tokens.join('').includes(searchString))
//       .forEach((x) => results.add(x.item));

//     return [...results];
//   }

//   return (searchPatternOrig: string) => {
//     let results = doSearch(searchPatternOrig);
//     if (results.length === 0 && isRuLayout(searchPatternOrig)) {
//       results = doSearch(fixRuLayout(searchPatternOrig));
//     }
//     return results;
//   };
// }
