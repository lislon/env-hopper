interface VersionWidgetProps {
  className?: string
}

export function VersionWidget({ className }: VersionWidgetProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <h3 className="text-sm font-medium text-secondary-foreground">Version</h3>
      <p className="text-sm font-medium">JIRA-1231-my-feature-123345</p>
      <p className="text-xs text-muted-foreground">
        Deployed 5 days ago • Igor Golovin
      </p>
    </div>
  )
}
