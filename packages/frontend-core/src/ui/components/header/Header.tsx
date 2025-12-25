import { Link } from '@tanstack/react-router'
import type React from 'react'
import EnvHopperLogo from '~/assets/env-hopper-logo.svg?react'
import { ThemeSwitcher } from '~/components/ThemeSwitcher'
import { Button } from '~/components/ui/button'
import { ShareLinkButton } from '~/modules/resourceJump/ui/ShareLinkButton'

export interface HeaderProps {
  middle?: React.ReactNode
}

export function Header({ middle }: HeaderProps) {
  return (
    <div className="flex items-center mb-4 justify-between gap-2">
      <div className="flex items-center gap-4">
        <Link to="/">
          <div className="flex items-center gap-2">
            <EnvHopperLogo className="h-16 w-16" />
            <span className="text-lg font-bold hidden md:block">Env‑Hopper</span>
          </div>
        </Link>
      </div>
      {middle && <div className="sm:min-w-[300px]">{middle}</div>}
      <div className="flex items-center gap-3">
        <ShareLinkButton />
        <ThemeSwitcher />
        <Button size="sm" variant={'outline'}>
          Login
        </Button>
      </div>
    </div>
  )
}

