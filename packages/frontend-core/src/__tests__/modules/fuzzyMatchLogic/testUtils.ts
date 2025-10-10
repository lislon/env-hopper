import type { FuzzySearchInputEntry } from '~/modules/fuzzyMatchLogic/types'

export function makeInputEntry(
  displayName: string,
): FuzzySearchInputEntry & { frequency: number } {
  const match = displayName.match(
    /\[frequency\s*=\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*\]/i,
  )
  const parsed = match?.[1] ? Number.parseFloat(match[1]) : 0
  const frequency = Number.isFinite(parsed) ? parsed : 0

  return {
    slug: displayName,
    displayName,
    frequency,
  }
}
