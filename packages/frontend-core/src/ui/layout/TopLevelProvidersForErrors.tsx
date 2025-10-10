import React from 'react'
import { ThemeProvider } from '~/components/theme-provider'
import { AuthProvider } from '~/modules/auth'
import { AuthModalProvider } from '~/modules/auth/AuthModalContext'
import { LoginModal } from '~/modules/auth/ui/LoginModal'

export interface TopLevelProvidersForErrorsProps {
  children: React.ReactNode
}

/**
 * Minimal providers needed for error boundaries and fallback UI
 * Includes authentication and theme providers to avoid "useAuth must be used within AuthProvider" errors
 * when error components try to render Header or other auth-dependent components
 */
export function TopLevelProvidersForErrors({ children }: TopLevelProvidersForErrorsProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthModalProvider>
        <AuthProvider>
          <>
            {children}
            <LoginModal />
          </>
        </AuthProvider>
      </AuthModalProvider>
    </ThemeProvider>
  )
}
