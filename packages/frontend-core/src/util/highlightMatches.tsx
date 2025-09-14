import React from 'react'

// Escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlightMatches(text: string, query: string): React.ReactNode {
  if (!query) return text

  const safeQuery = escapeRegex(query)
  const regex = new RegExp(`(${safeQuery})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, idx) => {
        const key = `${part}-${text.indexOf(part, idx)}`
        return idx % 2 === 1 ? (
          <span key={key} className="bg-highlight">
            {part}
          </span>
        ) : (
          <React.Fragment key={key}>{part}</React.Fragment>
        )
      })}
    </>
  )
}
