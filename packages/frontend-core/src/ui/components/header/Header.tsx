import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { LogOut, Settings } from 'lucide-react'
import type React from 'react'
import EnvHopperLogo from '~/assets/env-hopper-logo.svg?react'
import { ThemeSwitcher } from '~/components/ThemeSwitcher'
import {
  useAuth,
  useAuthActions,
  useIsAuthenticated,
  useUser,
} from '~/modules/auth'
import { useAuthModal } from '~/modules/auth/AuthModalContext'
import { ShareLinkButton } from '~/modules/resourceJump/ui/ShareLinkButton'
import { Button } from '~/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/ui/dropdown-menu'
import { Skeleton } from '~/ui/skeleton'

export interface HeaderProps {
  middle?: React.ReactNode
}

function HeaderNavLink({ to, label }: { to: string; label: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isActive = pathname === to || pathname.startsWith(`${to}/`)

  return (
    <Link
      to={to}
      className={
        'px-4 py-3 text-sm font-medium rounded-md transition-colors ' +
        (isActive
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/40')
      }
    >
      {label}
    </Link>
  )
}

export function Header({ middle }: HeaderProps) {
  const { isLoading } = useAuth()
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const { logout } = useAuthActions()
  const navigate = useNavigate()
  const { open: openLoginModal } = useAuthModal()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleAdminClick = () => {
    navigate({ to: '/admin' })
  }

  const handleLoginClick = () => {
    // Preserve the current URL for redirect after login
    const currentUrl = window.location.pathname + window.location.search
    openLoginModal(currentUrl)
  }

  return (
    <div className="flex items-center mb-4 justify-between gap-2">
      <div className="flex items-center gap-4">
        <Link to="/">
          <div className="flex items-center gap-2">
            <EnvHopperLogo className="h-16 w-16" />
            <span className="text-lg font-bold hidden md:block">
              Env‑Hopper
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <HeaderNavLink to="/envs" label="Envs" />
          <HeaderNavLink to="/dashboard" label="Hopper" />
          {isAuthenticated && <HeaderNavLink to="/admin" label="Admin" />}
        </div>
      </div>
      {middle && <div className="sm:min-w-75">{middle}</div>}
      <div className="flex items-center gap-3">
        <ShareLinkButton />
        <ThemeSwitcher />
        {isLoading ? (
          <Skeleton className="w-8 h-8 rounded-full" />
        ) : !isAuthenticated ? (
          <button
            type="button"
            onClick={handleLoginClick}
            className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Login
          </button>
        ) : user?.name ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 rounded-full p-0 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-3 flex items-center gap-3">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.email?.split('@')[0] || 'user'}
                  </p>
                  <p className="text-sm font-medium truncate">{user.name}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAdminClick}>
                <Settings className="h-4 w-4 mr-2" />
                <span>Admin</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  )
}
