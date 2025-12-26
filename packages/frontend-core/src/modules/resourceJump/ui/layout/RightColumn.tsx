export function RightColumn() {
  return (
    <div className="flex gap-2">
      <div>
        <div className="text-center text-secondary-foreground p-2">Envs</div>
        {/* <EnvSwitcher /> */}
      </div>
      <div>
        <div className="text-center text-secondary-foreground p-2">Apps</div>
        {/* <AppSwitcher /> */}
      </div>
    </div>
  )
}
