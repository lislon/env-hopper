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
export function makeAutoCompleteFilter(
  items: Array<SourceItem>,
): EhAutoCompleteFilter {
  const index = makeFuzzySearchIndex({
    entries: items.map((item) => ({ slug: item.id, displayName: item.title })),
  })
  const byId = new Map(items.map((item) => [item.id, item]))

  return (searchPattern) =>
    fuzzySearch(searchPattern, { index })
      .map((result) => byId.get(result.entry.slug))
      .filter((item): item is SourceItem => item !== undefined)
}
