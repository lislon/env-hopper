import { counting, sort } from 'radashi'
import type { ResourceJumpHistoryItem } from '~/modules/resourceJump/types'

export interface GetTopNParams<T> {
  historyFiltered: Array<ResourceJumpHistoryItem>
  groupByFn: (item: ResourceJumpHistoryItem) => string
  slugFinder: (slug: string) => T | undefined
  n: number
}

export function getTopN<T>({
  historyFiltered,
  groupByFn,
  slugFinder,
  n,
}: GetTopNParams<T>): Array<T> {
  const rankedBySlugs = counting(historyFiltered, groupByFn)
  const sorted = sort(Object.entries(rankedBySlugs), (e) => -e[1])
  const topN = sorted
    .slice(0, n)
    .map((e) => slugFinder(e[0]))
    .filter((e): e is T => e !== undefined)
  return topN
}
