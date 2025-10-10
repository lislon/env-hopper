export function highlightText(
  text: string,
  query: string,
  className?: string,
): React.ReactNode {
  const tokens = query
    .trim()
    .slice(0, 100)
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  if (!tokens.length) return text

  // match ANY token
  const regex = new RegExp(`(${tokens.join('|')})`, 'gi')

  return (
    <div className={className}>
      {text
        .split(regex)
        .map((part, idx) =>
          idx % 2 === 1 ? <mark key={`${text + idx}`}>{part}</mark> : part,
        )}
    </div>
  )
}
