export interface AppLoginPassWidgetsPanelProps {
  className?: string
}

/**
 * STUB — the widgets wave owns this.
 *
 * The panel of credential, note and custom widgets shown beside the form. It is
 * blocked on data, not on porting: every widget reads `app.meta`, and the
 * bootstrap payload carries none today, so a full port would render an empty
 * panel anyway. `ReadonlyCopyField` and `CopyButton`, which the widgets are
 * built from, ARE ported and ready.
 */
export function AppLoginPassWidgetsPanel({
  className,
}: AppLoginPassWidgetsPanelProps) {
  return <div className={className} data-testid="widgets-placeholder" />
}
