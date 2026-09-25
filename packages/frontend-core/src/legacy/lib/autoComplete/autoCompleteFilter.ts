import {
  fuzzySearch,
  makeFuzzySearchIndex,
} from '~/modules/fuzzyMatchLogic/autoCompleteFilter'
import type { SourceItem } from '../../ui/AutoComplete/common'
import type { EhAutoCompleteFilter } from '../../ui/AutoComplete/EhAutoComplete'

/**
 * ADAPTER, NOT A PORT — the ranking itself is a later wave.
 *
 * The previous UI had its own matcher; a descendant of it already lives in
 * `~/modules/fuzzyMatchLogic` and is already covered by tests, so this is a
 * shape converter only: the previous call signature in, that matcher out. There
 * is deliberately no second scoring implementation to keep in step.
 *
 * Ranking parity against the previous matcher's own spec cases is the
 * find/autocomplete wave's job, and divergences belong in ITS fixtures — do not
 * tune scores here.
 */
/**
 * Favourite beats recent beats everything else, which is what the previous
 * matcher's first two sort tiers did (`['notFavorite', 'notRecent']`).
 *
 * The section headers only appear while the input is empty — once someone types,
 * every row shown comes from the 'all' section and the list is flat — so
 * without this a favourite is indistinguishable from any other match exactly
 * when the list is long enough for that to matter.
 *
 * Expressed through the matcher's existing frequency tier rather than a second
 * sort: it breaks ties at the same point, after match rank.
 */
function rankBoost(item: SourceItem): number {
  if (item.favorite) {
    return 2
  }
  if (item.recent) {
    return 1
  }
  return 0
}

export function makeAutoCompleteFilter(
  items: Array<SourceItem>,
): EhAutoCompleteFilter {
  const index = makeFuzzySearchIndex({
    entries: items.map((item) => ({ slug: item.id, displayName: item.title })),
  })
  const byId = new Map(items.map((item) => [item.id, item]))

  return (searchPattern) =>
    fuzzySearch(searchPattern, {
      index,
      freqGetter: (slug) => {
        const item = byId.get(slug)
        return item ? rankBoost(item) : 0
      },
    })
      .map((result) => byId.get(result.entry.slug))
      .filter((item): item is SourceItem => item !== undefined)
}
