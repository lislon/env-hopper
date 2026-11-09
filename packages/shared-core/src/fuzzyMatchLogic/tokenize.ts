export function normalize(str: string): string {
  const text = str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  return text
}

const TOKEN_SPLIT = new RegExp(
  [
    String.raw`[\p{Z}\p{P}\p{S}]+`,
    String.raw`(?<=\p{Nd})(?=\p{L})`,
    String.raw`(?<=\p{L})(?=\p{Nd})`,
    String.raw`(?<=[\p{Ll}\p{Nd}])(?=\p{Lu})`,
    String.raw`(?<=\p{Lu})(?=\p{Lu}\p{Ll})`,
  ].join('|'),
  'u',
)

export function tokenize(str: string): Array<string> {
  // We mostly split on whitespace/punctuation/symbols, but we also want to keep
  // certain standalone symbols (like '#') as their own tokens so queries like
  // "order #" can specifically match entries containing "#".
  const raw = str
    .split(TOKEN_SPLIT)
    .filter(Boolean)
    .map((s) => s.toLowerCase())

  const symbolTokens = [...str]
    .filter((c) => /[#]/.test(c))
    .map((c) => c.toLowerCase())

  // Preserve original ordering as best-effort by appending symbols; for our
  // current use cases it’s enough that the symbol token exists.
  return [...raw, ...symbolTokens]
}

export function enrichTokensForIndex(tokens: Array<string>): Array<string> {
  const newTokens = tokens.flatMap((token) => {
    if (token.startsWith('0')) {
      return [token.replace(/^0+(?=[1-9])/, ''), token]
    }
    return [token]
  })
  return newTokens
}
