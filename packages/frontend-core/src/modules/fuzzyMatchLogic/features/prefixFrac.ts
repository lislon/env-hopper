import { longestCommonPrefix } from '../utils'

export function prefixFrac(
  needle: string,
  candidate: string,
  qLen: number,
): number {
  if (qLen === 0) {
    return 0
  }
  const lcp = longestCommonPrefix(needle, candidate)
  return lcp / qLen
}
