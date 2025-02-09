import { Encoder, Index } from 'flexsearch'
import { score } from './scoring'
import type {
  FuzzySearchContext,
  FuzzySearchIndex,
  FuzzySearchPrepareIndexParams,
  FuzzySearchReturnItem
} from './types'

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
  index.add(idx, entry.displayName || entry.slug)
  // index.add(idx, enrichTokensForIndex(tokenize(entry.displayName || entry.slug)).join(' '))
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
  const postFiltrationResults = context.index.flexIndex
    .searchCache(needle)
    .map((id) => {
      return {
        entry: context.index.entries[id as number]!,
      }
    })

  // const tokenizedNeedle = tokenize(needle)

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
  return score(postFiltrationResults, needle)
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
