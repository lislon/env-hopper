/** At most this many characters of an error reach a browser. */
export const PUBLIC_MESSAGE_MAX = 160

/**
 * An error message fit for any browser: its first line only (never a stack),
 * with URLs, hosts, IPs, emails, SQL and anything that looks like a secret
 * replaced by placeholders, at most `PUBLIC_MESSAGE_MAX` characters.
 */
export function publicMessage(raw: string): string {
  const firstLine = raw.split(/\r?\n/)[0] ?? ''
  return firstLine
    .replace(
      /\b(?:SELECT\b[\s\S]*?\bFROM|INSERT\s+INTO|UPDATE\s+\S+\s+SET|DELETE\s+FROM)\b[\s\S]*/i,
      '<sql>',
    )
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, '<url>')
    .replace(/\bBearer\s+\S+/gi, 'Bearer <token>')
    .replace(
      /\b(password|passwd|pwd|token|secret|api[_-]?key|authorization|cookie)\b(\s*[=:]\s*)\S+/gi,
      '$1$2<redacted>',
    )
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '<email>')
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/g, '<ip>')
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?\b/gi, '<host>')
    .replace(/\b[A-Za-z0-9_\-+/=]{24,}\b/g, '<token>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PUBLIC_MESSAGE_MAX)
}
