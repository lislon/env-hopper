import { Button } from '~/components/ui/button'
import { ThemeSwitcher } from '~/components/ThemeSwitcher'
import EnvHopperLogo from '~/assets/env-hopper-logo.svg?react'

export function PlaygroundHeader() {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* Left side: Logo + Mode */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <EnvHopperLogo className="h-16 w-16" />
          <h1 className="text-lg font-bold">Env‑Hopper</h1>
        </div>
        <span className="text-xs text-muted-foreground">Jump</span>
      </div>

      {/* Right side: Theme switcher + Login */}
      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        <Button size="sm" variant={'outline'}>
          Login
        </Button>
      </div>
    </div>
  )
}
