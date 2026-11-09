import { fuzzySearch, makeFuzzySearchIndex } from './autoCompleteFilter'

export interface MatchCandidate {
  slug: string
  name: string
  /** Matched exactly only: a fuzzy hit on an alias would beat a better name. */
  aliases?: Array<string>
}

export interface MatchOption {
  slug: string
  name: string
}

/**
 * What a person's words name. `picked` null: the words name nothing for sure,
 * and `options` are what to ask about. `picked` with `options`: a guess, and
 * the runner-up worth mentioning.
 */
export interface MatchDecision {
  picked: string | null
  options: Array<MatchOption>
}

export interface PickMatchOptions {
  /** Breaks a tie only, never overrides a better match: e.g. "takes the given params". */
  prefer?: (slug: string) => boolean
}

const MAX_OPTIONS = 8
const MAX_CLOSEST = 3

/** Case, spaces and punctuation ignored: `Alpha Integration-01` equals `alphaintegration01`. */
function glue(text: string): string {
  return text.toLowerCase().replaceAll(/[^\p{L}\p{N}]/gu, '')
}

function words(text: string): string {
  return ` ${text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .join(' ')} `
}

function bigrams(text: string): Array<string> {
  const g = glue(text)
  return Array.from({ length: Math.max(g.length - 1, 0) }, (_, i) =>
    g.slice(i, i + 2),
  )
}

/** Dice similarity over letter pairs, for words that match nothing at all. */
function similarity(a: string, b: string): number {
  const x = bigrams(a)
  const y = bigrams(b)
  if (x.length + y.length === 0) return 0
  const pool = [...y]
  let common = 0
  for (const g of x) {
    const at = pool.indexOf(g)
    if (at !== -1) {
      common++
      pool.splice(at, 1)
    }
  }
  return (2 * common) / (x.length + y.length)
}

const toOption = (c: MatchCandidate): MatchOption => ({
  slug: c.slug,
  name: c.name,
})

/**
 * The one rule every name lookup follows:
 *  - exact slug, name or alias: picked, no options;
 *  - one candidate clearly best: picked, runner-up as the option;
 *  - the best ones equally good: null, those as options;
 *  - nothing matches: null, the closest by spelling as options.
 *
 * "Clearly best" is the matcher's rank, then whether the words appear as whole
 * words in the name: `alpha` names `alpha-integration-01` better than `alphabox-01`.
 */
export function pickMatch(
  query: string,
  candidates: Array<MatchCandidate>,
  { prefer }: PickMatchOptions = {},
): MatchDecision {
  const q = glue(query)
  const exact = candidates.filter((c) =>
    [c.slug, c.name, ...(c.aliases ?? [])].some((t) => glue(t) === q),
  )
  if (exact.length === 1) return { picked: exact[0]!.slug, options: [] }
  if (exact.length > 1) {
    return { picked: null, options: exact.slice(0, MAX_OPTIONS).map(toOption) }
  }

  const bySlug = new Map(candidates.map((c) => [c.slug, c]))
  const index = makeFuzzySearchIndex({
    entries: candidates.map((c) => ({ slug: c.slug, displayName: c.name })),
  })
  const qWords = words(query)
  const scored = fuzzySearch(query, { index }).map((r) => ({
    candidate: bySlug.get(r.entry.slug)!,
    score:
      r.rank * 4 +
      (words(r.entry.displayName).includes(qWords) ? 2 : 0) +
      (prefer?.(r.entry.slug) ? 1 : 0),
  }))
  // Stable: equal scores keep the matcher's own order.
  scored.sort((a, b) => b.score - a.score)

  const [first, second] = scored
  if (!first) {
    const closest = candidates
      .map((c) => ({ c, s: similarity(query, c.name) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_CLOSEST)
      .map((x) => toOption(x.c))
    return { picked: null, options: closest }
  }
  if (!second) return { picked: first.candidate.slug, options: [] }
  if (first.score > second.score) {
    return {
      picked: first.candidate.slug,
      options: [toOption(second.candidate)],
    }
  }
  return {
    picked: null,
    options: scored
      .filter((s) => s.score === first.score)
      .slice(0, MAX_OPTIONS)
      .map((s) => toOption(s.candidate)),
  }
}
