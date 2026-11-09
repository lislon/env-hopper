export function normalize(x: string): string {
  // lower, NFKD, strip combining marks (accents), collapse spaces
  return x
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function longestCommonPrefix(a: string, b: string): number {
  const n = Math.min(a.length, b.length)
  let i = 0
  while (i < n && a.charCodeAt(i) === b.charCodeAt(i)) {
    i++
  }
  return i
}
