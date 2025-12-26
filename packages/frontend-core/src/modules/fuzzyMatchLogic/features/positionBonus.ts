export function positionBonus(
  needle: string,
  candidate: string,
  positionDecayAlpha: number,
): number {
  if (needle.length === 0) {
    return 0
  }

  const n = needle.toLowerCase()
  const c = candidate.toLowerCase()

  const idx = c.indexOf(n)
  if (idx === -1) {
    // Not a contiguous substring — no bonus.
    return 0
  }

  // Prefer earlier matches exponentially.
  // idx=0 -> 1, idx grows -> 0.
  const early = Math.exp(-positionDecayAlpha * idx)

  // Only use length as a gentle tie-breaker when the match starts at the same
  // position (e.g., query "1" matches "env-1" and "env-001" at the same idx).
  // This avoids reordering results for cases where position differs.
  const lenFactor = 1 / (1 + Math.max(0, candidate.length - needle.length))

  return early * lenFactor
}
