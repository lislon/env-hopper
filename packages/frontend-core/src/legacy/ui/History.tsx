export interface HistoryProps {
  className?: string
}

/**
 * STUB — the memory wave owns this.
 *
 * The recent-jumps list that used to sit under the form. The data behind it is
 * already here (`EhContext.recentJumps`, persisted under the same localStorage
 * key the previous UI used), so this wave only leaves the presentation out. The
 * grid cell is still rendered so the layout does not reflow when it lands.
 */
export function History({ className }: HistoryProps) {
  return <div className={className} data-testid="history-placeholder" />
}
