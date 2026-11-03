/**
 * The light spinner a line shows while something it displays is being read
 * again; `title` says what. Styled by `.eh-deployed-verify` (index.css).
 */
export function CheckingSpinner({
  title,
  className = '',
}: {
  title: string
  className?: string
}) {
  return (
    <span
      className={`eh-deployed-verify ${className}`}
      role="status"
      aria-label={title}
      title={title}
    >
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <circle
          cx="6"
          cy="6"
          r="4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="7 21.3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
